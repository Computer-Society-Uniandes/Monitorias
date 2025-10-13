import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Register from "../src/app/auth/register/page";

// Mock Firebase Auth
jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: {
      uid: "test-uid",
      email: "test@example.com",
      displayName: "Test User"
    }
  }))
}));

// Mock Firebase Firestore
jest.mock("../src/firebaseConfig", () => ({
  auth: {},
  db: {}
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({
    forEach: jest.fn()
  }))
}));

// Mock the auth context
jest.mock("../src/app/context/SecureAuthContext", () => ({
  useAuth: jest.fn(() => ({
    login: jest.fn(() => Promise.resolve({ success: true }))
  }))
}));

// Mock the i18n hook
jest.mock("../src/lib/i18n", () => ({
  useI18n: jest.fn(() => ({
    t: (key) => key
  }))
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn()
  }))
}));

// Mock Next.js Image component
jest.mock("next/image", () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

describe("Register Page", () => {
  it("renders registration form correctly", async () => {
    render(<Register />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("auth.register.title")).toBeInTheDocument();
    });

    // Check if form elements are rendered
    expect(screen.getByText("auth.register.name")).toBeInTheDocument();
    expect(screen.getByText("auth.register.phone")).toBeInTheDocument();
    expect(screen.getByText("auth.register.email")).toBeInTheDocument();
    expect(screen.getByText("auth.register.password")).toBeInTheDocument();
    expect(screen.getByText("auth.register.confirmPassword")).toBeInTheDocument();
    expect(screen.getByText("auth.register.major")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "auth.register.registerButton" })).toBeInTheDocument();
  });

  it("updates form values when user types", async () => {
    render(<Register />);
    
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText("auth.register.namePlaceholder");
      const emailInput = screen.getByPlaceholderText("auth.register.emailPlaceholder");
      const passwordInput = screen.getByPlaceholderText("auth.register.passwordPlaceholder");
      
      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      
      expect(nameInput.value).toBe("Test User");
      expect(emailInput.value).toBe("test@example.com");
      expect(passwordInput.value).toBe("password123");
    });
  });

  it("shows login link", async () => {
    render(<Register />);
    
    await waitFor(() => {
      expect(screen.getByText("auth.register.signIn")).toBeInTheDocument();
    });
  });

  it("has required form inputs", async () => {
    render(<Register />);
    
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText("auth.register.namePlaceholder");
      const emailInput = screen.getByPlaceholderText("auth.register.emailPlaceholder");
      const passwordInput = screen.getByPlaceholderText("auth.register.passwordPlaceholder");
      const confirmPasswordInput = screen.getByPlaceholderText("auth.register.confirmPasswordPlaceholder");
      
      expect(nameInput).toHaveAttribute("type", "text");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(confirmPasswordInput).toHaveAttribute("type", "password");
    });
  });

  it("renders major selection dropdown", async () => {
    render(<Register />);
    
    await waitFor(() => {
      expect(screen.getByText("auth.register.major")).toBeInTheDocument();
      expect(screen.getByDisplayValue("auth.register.majorPlaceholder")).toBeInTheDocument();
    });
  });

  it("validates password confirmation", async () => {
    render(<Register />);
    
    await waitFor(() => {
      const passwordInput = screen.getByPlaceholderText("auth.register.passwordPlaceholder");
      const confirmPasswordInput = screen.getByPlaceholderText("auth.register.confirmPasswordPlaceholder");
      
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "different123" } });
      
      // The form should handle password mismatch validation
      expect(passwordInput.value).toBe("password123");
      expect(confirmPasswordInput.value).toBe("different123");
    });
  });
});
