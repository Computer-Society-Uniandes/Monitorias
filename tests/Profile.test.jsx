import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "../src/app/home/profile/page";

// Mock the auth context
jest.mock("../src/app/context/SecureAuthContext", () => ({
  useAuth: jest.fn(() => ({
    user: { 
      email: "test@example.com", 
      isLoggedIn: true, 
      isTutor: true,
      displayName: "Test User" 
    },
    authLoading: false,
    logout: jest.fn()
  }))
}));

// Mock the i18n hook
jest.mock("../src/lib/i18n", () => ({
  useI18n: jest.fn(() => ({
    t: (key) => key
  }))
}));

// Mock the UserProfileService
jest.mock("../src/app/services/core/UserProfileService", () => ({
  UserProfileService: {
    getUserProfile: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        name: "Test User",
        phone_number: "1234567890",
        description: "Test description",
        specialization: "Math, Physics"
      }
    })),
    getTutorSubjects: jest.fn(() => Promise.resolve({
      success: true,
      data: [
        { id: "1", name: "Mathematics" },
        { id: "2", name: "Physics" }
      ]
    })),
    updateUserProfile: jest.fn(() => Promise.resolve({
      success: true
    }))
  }
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn()
  }))
}));

describe("Profile Page", () => {
  beforeEach(() => {
    // Clear localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'student'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it("renders profile page correctly", async () => {
    render(<Profile />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    // Check if profile elements are rendered
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Math, Physics")).toBeInTheDocument();
    expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
  });

  it("shows edit profile button", async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText("profile.editProfile")).toBeInTheDocument();
    });
  });

  it("opens edit modal when edit button is clicked", async () => {
    render(<Profile />);
    
    await waitFor(() => {
      const editButton = screen.getByText("profile.editProfile");
      fireEvent.click(editButton);
    });

    // Check if modal opens
    expect(screen.getByText("profile.editModal.title")).toBeInTheDocument();
  });

  it("shows tutor-specific elements for tutors", async () => {
    render(<Profile />);
    
    await waitFor(() => {
      // Check for rating section
      expect(screen.getByText("profile.rating")).toBeInTheDocument();
      expect(screen.getByText("profile.sessionsCompleted")).toBeInTheDocument();
      expect(screen.getByText("profile.studentsHelped")).toBeInTheDocument();
      
      // Check for subjects section
      expect(screen.getByText("profile.subjects")).toBeInTheDocument();
    });
  });

  it("shows logout button", async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText("profile.logout")).toBeInTheDocument();
    });
  });
});
