import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ReviewModal from "../src/app/components/ReviewModal/ReviewModal";


jest.mock("firebase/firestore", () => {
  const transactionMock = {
    get: jest.fn(async () => ({
      exists: () => true,
      data: () => ({ reviews: [] }),
    })),
    update: jest.fn(),
  };

  return {
    getFirestore: jest.fn(),
    doc: jest.fn(),
    updateDoc: jest.fn(),
    arrayUnion: jest.fn((v) => v),
    runTransaction: jest.fn((db, callback) => Promise.resolve(callback(transactionMock))),
    getDoc: jest.fn(async () => ({ exists: () => true, data: () => ({ reviews: [] }) })),
  };
});


jest.mock("../src/app/context/SecureAuthContext", () => ({
  useAuth: jest.fn(() => ({
    user: { email: "test@example.com", displayName: "Test User" },
  })),
}));


jest.mock("../src/lib/i18n", () => ({
  useI18n: jest.fn(() => ({
    t: (key) => key, 
    lang: "en",
  })),
}));


jest.mock("../src/app/components/ReviewModal/NotificationReview", () => {
  return function MockSuccessModal({ open, onClose }) {
    if (!open) return null;
    return (
      <div data-testid="success-modal">
        <button onClick={onClose}>successModal.close</button>
      </div>
    );
  };
});

describe("ReviewModal - tests completos", () => {
  const sessionMock = {
    id: "123",
    subject: "Matemáticas",
    tutorName: "Erick",
    scheduledDateTime: "2025-10-12T10:00:00Z",
    price: 30000,
  };

  const originalAlert = global.alert;

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
  });

  afterAll(() => {
    global.alert = originalAlert;
    jest.restoreAllMocks();
  });

  it("renderiza correctamente la información de la tutoría", () => {
    render(<ReviewModal session={sessionMock} onClose={() => {}} />);
    expect(screen.getByText("review.newTitle")).toBeInTheDocument();
    expect(screen.getByText("Matemáticas")).toBeInTheDocument();
    expect(screen.getByText("Erick")).toBeInTheDocument();
    expect(screen.getByText(/\$30000/)).toBeInTheDocument();
  });

  it("permite seleccionar estrellas y escribir un comentario", async () => {
    render(<ReviewModal session={sessionMock} onClose={() => {}} />);

    const allButtons = screen.getAllByRole("button");
    const starButtons = allButtons.filter((b) => b.className && b.className.includes("text-3xl"));
    expect(starButtons.length).toBeGreaterThanOrEqual(5);

    await act(async () => {
      fireEvent.click(starButtons[4]);
    });
    expect(starButtons[4].className).toEqual(expect.stringContaining("text-yellow-500"));

    const textarea = screen.getByRole("textbox");
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Excelente tutoría" } });
    });
    expect(textarea).toHaveValue("Excelente tutoría");
  });

  it("prefill cuando ya existe una reseña del usuario", async () => {
    const fs = require("firebase/firestore");
    fs.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        reviews: [{ reviewerEmail: "test@example.com", stars: 4, comment: "Buen profe" }],
      }),
    });

    render(<ReviewModal session={sessionMock} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveValue("Buen profe");
    });

    const allButtons = screen.getAllByRole("button");
    const starButtons = allButtons.filter((b) => b.className && b.className.includes("text-3xl"));
    expect(starButtons[3].className).toEqual(expect.stringContaining("text-yellow-500"));
  });

  it("muestra el success modal después de enviar la reseña (creación)", async () => {
    render(<ReviewModal session={sessionMock} onClose={() => {}} />);

    const allButtons = screen.getAllByRole("button");
    const starButtons = allButtons.filter((b) => b.className && b.className.includes("text-3xl"));
    await act(async () => {
      fireEvent.click(starButtons[4]);
    });

    await act(async () => {
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "Muy buena clase" } });
    });

    const submit = screen.getByRole("button", { name: "review.buttons.submit" });
    await act(async () => {
      fireEvent.click(submit);
    });

    await waitFor(() => {
      expect(screen.getByTestId("success-modal")).toBeInTheDocument();
    });
  });

  it("actualiza la reseña existente (transaction.update llamado)", async () => {
    const txMock = {
      get: jest.fn(async () => ({
        exists: () => true,
        data: () => ({ reviews: [{ reviewerEmail: "test@example.com", stars: 3, comment: "old" }] }),
      })),
      update: jest.fn(),
    };

    const fs = require("firebase/firestore");
    fs.runTransaction.mockImplementationOnce((db, callback) => Promise.resolve(callback(txMock)));

    render(<ReviewModal session={sessionMock} onClose={() => {}} />);

    const allButtons = screen.getAllByRole("button");
    const starButtons = allButtons.filter((b) => b.className && b.className.includes("text-3xl"));
    await act(async () => {
      fireEvent.click(starButtons[1]); // 2 estrellas
    });
    await act(async () => {
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "updated" } });
    });

    const submit = screen.getByRole("button", { name: "review.buttons.submit" });
    await act(async () => {
      fireEvent.click(submit);
    });

    await waitFor(() => {
      expect(txMock.update).toHaveBeenCalled();
      const updateArg = txMock.update.mock.calls[0][1];
      if (updateArg && updateArg.reviews) {
        expect(updateArg.reviews.some(r => r.comment === "updated")).toBeTruthy();
      }
    });
  });

  it("muestra alerta cuando runTransaction falla", async () => {
    const fs = require("firebase/firestore");
    fs.runTransaction.mockImplementationOnce(() => Promise.reject(new Error("boom")));

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(<ReviewModal session={sessionMock} onClose={() => {}} />);

    const allButtons = screen.getAllByRole("button");
    const starButtons = allButtons.filter((b) => b.className && b.className.includes("text-3xl"));
    await act(async () => {
      fireEvent.click(starButtons[4]);
    });
    await act(async () => {
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "x" } });
    });

    const submit = screen.getByRole("button", { name: "review.buttons.submit" });
    await act(async () => {
      fireEvent.click(submit);
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("review.errors.saveError");
    });

    spy.mockRestore();
  });

  it("deshabilita el botón enviar mientras se realiza la transacción", async () => {
    const pending = new Promise(() => {});
    const fs = require("firebase/firestore");
    fs.runTransaction.mockImplementationOnce(() => pending);

    render(<ReviewModal session={sessionMock} onClose={() => {}} />);

    const allButtons = screen.getAllByRole("button");
    const starButtons = allButtons.filter((b) => b.className && b.className.includes("text-3xl"));
    await act(async () => {
      fireEvent.click(starButtons[4]);
    });
    await act(async () => {
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "x" } });
    });

    const submit = screen.getByRole("button", { name: "review.buttons.submit" });
    await act(async () => {
      fireEvent.click(submit);
    });

    expect(submit).toBeDisabled();
  });

  it("cierra el modal principal al hacer click en 'Cerrar'", async () => {
    const mockOnClose = jest.fn();
    render(<ReviewModal session={sessionMock} onClose={mockOnClose} />);

    const closeBtn = screen.getByRole("button", { name: "review.buttons.close" });
    await act(async () => {
      fireEvent.click(closeBtn);
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("cierra el success modal al oprimir su botón de cerrar y llama onClose del ReviewModal", async () => {
    const mockOnClose = jest.fn();

    render(<ReviewModal session={sessionMock} onClose={mockOnClose} />);

    const allButtons = screen.getAllByRole("button");
    const starButtons = allButtons.filter((b) => b.className && b.className.includes("text-3xl"));
    await act(async () => {
      fireEvent.click(starButtons[4]);
    });
    await act(async () => {
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "ok" } });
    });

    const submit = screen.getByRole("button", { name: "review.buttons.submit" });
    await act(async () => {
      fireEvent.click(submit);
    });

    await waitFor(() => expect(screen.getByTestId("success-modal")).toBeInTheDocument());

    const closeSuccess = screen.getByRole("button", { name: "successModal.close" });
    await act(async () => {
      fireEvent.click(closeSuccess);
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
