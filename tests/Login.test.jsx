import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../src/app/auth/login/page";

// Mock the auth context
jest.mock("../src/app/context/SecureAuthContext", () => ({
  useAuth: jest.fn(() => ({
    user: { 
      email: "", 
      isLoggedIn: false
    },
    login: jest.fn(() => Promise.resolve({
      success: true
    }))
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
    push: jest.fn(),
    replace: jest.fn()
  }))
}));

// Mock Next.js Image component
jest.mock("next/image", () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

describe("Login Page", () => {
  it("renders login form correctly", async () => {
    render(<Login />);
    
    // Wait for the component to mount
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "auth.login.subtitle" })).toBeInTheDocument();
    });

    // Check if form elements are rendered
    expect(screen.getByLabelText("auth.login.email")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.login.password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "auth.login.loginButton" })).toBeInTheDocument();
  });

  it("updates form values when user types", async () => {
    render(<Login />);
    
    await waitFor(() => {
      const emailInput = screen.getByLabelText("auth.login.email");
      const passwordInput = screen.getByLabelText("auth.login.password");
      
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      
      expect(emailInput.value).toBe("test@example.com");
      expect(passwordInput.value).toBe("password123");
    });
  });

  it("submits form when login button is clicked", async () => {
    const mockLogin = jest.fn(() => Promise.resolve({ success: true }));
    
    jest.mocked(require("../src/app/context/SecureAuthContext").useAuth).mockReturnValue({
      user: { email: "", isLoggedIn: false },
      login: mockLogin
    });

    render(<Login />);
    
    await waitFor(() => {
      const emailInput = screen.getByLabelText("auth.login.email");
      const passwordInput = screen.getByLabelText("auth.login.password");
      const submitButton = screen.getByRole("button", { name: "auth.login.loginButton" });
      
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123"
      });
    });
  });

  it("shows register link", async () => {
    render(<Login />);
    
    await waitFor(() => {
      expect(screen.getByText("auth.login.signUp")).toBeInTheDocument();
    });
  });

  it("has required form inputs", async () => {
    render(<Login />);
    
    await waitFor(() => {
      const emailInput = screen.getByLabelText("auth.login.email");
      const passwordInput = screen.getByLabelText("auth.login.password");
      
      expect(emailInput).toHaveAttribute("type", "email");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(emailInput).toHaveAttribute("required");
      expect(passwordInput).toHaveAttribute("required");
    });
  });
});
