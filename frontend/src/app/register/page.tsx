"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AuthService } from "@/services/auth";
import { AvatarService } from "@/services/avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { SportService, Sport } from "@/services/sport";
import {
  CityLocationPicker,
  CityLocationData,
} from "@/components/ui/CityLocationPicker";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [locationData, setLocationData] = useState<CityLocationData | null>(
    null,
  );
  const [sports, setSports] = useState<string[]>([]);
  const [sportInput, setSportInput] = useState("");
  const [showSportsDropdown, setShowSportsDropdown] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [availableSports, setAvailableSports] = useState<Sport[]>([]);
  const [loadingSports, setLoadingSports] = useState(true);

  const router = useRouter();

  // Helper function to check if dark mode should be enabled
  const shouldEnableDarkMode = (
    savedTheme: string | null,
    prefersDark: boolean,
  ): boolean => {
    const hasExplicitDarkTheme = savedTheme === "dark";
    const shouldUseSystemPreference = !savedTheme && prefersDark;
    return hasExplicitDarkTheme || shouldUseSystemPreference;
  };

  useEffect(() => {
    // Check for saved dark mode preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (shouldEnableDarkMode(savedTheme, prefersDark)) {
      document.documentElement.classList.add("dark");
    }

    // Load sports from API
    const loadSports = async () => {
      try {
        setLoadingSports(true);
        const sportsData = await SportService.getAllSports();
        setAvailableSports(sportsData);
      } catch (error) {
        console.error("Failed to load sports:", error);
        // Fallback to a basic list if API fails
        setAvailableSports([
          { id: 1, name: "Football" },
          { id: 2, name: "Basketball" },
          { id: 3, name: "Tennis" },
          { id: 4, name: "Swimming" },
          { id: 5, name: "Running" },
        ]);
      } finally {
        setLoadingSports(false);
      }
    };

    loadSports();
  }, []);

  const validateEmail = () => {
    if (!email) {
      setError("Email is required");
      return false;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!firstName) {
      setError("First name is required");
      return false;
    }
    if (!lastName) {
      setError("Last name is required");
      return false;
    }
    if (!username) {
      setError("Username is required");
      return false;
    }
    if (!locationData) {
      setError("Location is required");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (sports.length === 0) {
      setError("Please select at least one sport");
      return false;
    }
    if (!password) {
      setError("Password is required");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await AuthService.checkEmail(email);

      if (response.success && response.available) {
        // Email is available, proceed to step 2
        setStep(2);
      } else {
        // Email already exists or other error
        setError(
          response.error ||
            "Email is already in use. Please try a different email.",
        );
      }
    } catch (error) {
      console.error("Email check failed:", error);
      setError("Failed to check email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Next = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);

    try {
      // Check if username is available during form submission
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/check-username`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username }),
          credentials: "include",
        },
      );

      if (response.ok) {
        setStep(3);
      } else {
        const errorData = await response.json();
        setError(
          errorData.message ||
            "Username is already taken. Please choose a different one.",
        );
      }
    } catch (error) {
      console.error("Username check failed:", error);
      setError("Failed to check username availability. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (validateStep3()) {
      setStep(4);
    }
  };

  // Helper function to create registration data object
  const createRegistrationData = () => {
    return {
      email: email,
      password: password,
      confirm_password: confirmPassword,
      first_name: firstName,
      last_name: lastName,
      username: username,
      location: locationData?.displayName || "",
      sports: sports,
      bio: bio,
    };
  };

  // Helper function to handle avatar upload after registration
  const handleAvatarUpload = async (): Promise<void> => {
    if (!avatar) {
      alert("Registration successful! Please log in.");
      return;
    }

    try {
      const loginResponse = await AuthService.login({
        email: email,
        password: password,
      });

      if (!loginResponse.success || !loginResponse.token) {
        alert(
          "Registration successful! Please log in to complete your profile.",
        );
        return;
      }

      const uploadResult = await AvatarService.uploadAvatar(avatar);
      const message = uploadResult.success
        ? "Registration successful! Profile picture uploaded."
        : "Registration successful! However, profile picture upload failed. You can upload it later from your profile.";

      alert(message);
    } catch (uploadError) {
      console.error("Avatar upload error:", uploadError);
      alert(
        "Registration successful! However, profile picture upload failed. You can upload it later from your profile.",
      );
    }
  };

  // Helper function to handle successful registration
  const handleRegistrationSuccess = async (): Promise<void> => {
    await handleAvatarUpload();
    router.push("/login");
  };

  // Helper function to handle registration failure
  const handleRegistrationFailure = (response: { error?: string }): void => {
    setError(response.error || "Registration failed. Please try again.");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateStep3()) {
      return;
    }

    setIsLoading(true);

    try {
      const registrationData = createRegistrationData();
      const response = await AuthService.register(registrationData);

      if (response.success) {
        await handleRegistrationSuccess();
      } else {
        handleRegistrationFailure(response);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSportAdd = (sport: string) => {
    if (sport && !sports.includes(sport)) {
      setSports((prev) => [...prev, sport]);
    }
    setSportInput("");
  };

  const handleSportRemove = (sport: string) => {
    setSports((prev) => prev.filter((s) => s !== sport));
  };

  // Helper function to check if backspace should remove last sport
  const shouldRemoveLastSportOnBackspace = (key: string): boolean => {
    const isBackspaceKey = key === "Backspace";
    const isInputEmpty = sportInput === "";
    const hasSports = sports.length > 0;
    return isBackspaceKey && isInputEmpty && hasSports;
  };

  // Helper function to handle enter key press for sports
  const handleEnterKeyForSports = (): void => {
    const filteredSports = getFilteredSports();
    if (filteredSports.length > 0) {
      handleSportAdd(filteredSports[0]);
    }
  };

  // Helper function to handle backspace key press for sports
  const handleBackspaceForSports = (): void => {
    handleSportRemove(sports[sports.length - 1]);
  };

  const handleSportInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEnterKeyForSports();
    } else if (shouldRemoveLastSportOnBackspace(e.key)) {
      handleBackspaceForSports();
    }
  };

  const getFilteredSports = () => {
    return availableSports
      .filter(
        (sport) =>
          sport.name.toLowerCase().includes(sportInput.toLowerCase()) &&
          !sports.includes(sport.name),
      )
      .map((sport) => sport.name);
  };

  const getAvailableSports = () => {
    return availableSports
      .filter((sport) => !sports.includes(sport.name))
      .map((sport) => sport.name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-25 to-teal-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-800 flex items-center justify-center p-4 transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-teal-400/8 to-blue-600/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-400/5 to-pink-600/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/assets/logo.png"
              alt="Link2Sport Logo"
              width={48}
              height={48}
              className="mr-3 shadow-lg transform hover:scale-105 transition-all duration-200"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
                Link2Sport
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
                Find your game. Connect with players.
              </p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="relative">
          {/* Main glass container */}
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8 transition-all duration-300">
            {/* Inner gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-blue-500/2 dark:from-gray-700/5 dark:to-purple-500/2 rounded-2xl pointer-events-none"></div>

            {/* Content */}
            <div className="relative z-10">
              {/* Progress Indicator */}
              <div className="flex items-center justify-center space-x-2 mb-8">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      step >= 1
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    1
                  </div>
                  <div
                    className={`w-8 h-1 rounded-full transition-all duration-300 ${
                      step >= 2 ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
                    }`}
                  ></div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      step >= 2
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    2
                  </div>
                  <div
                    className={`w-8 h-1 rounded-full transition-all duration-300 ${
                      step >= 3 ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
                    }`}
                  ></div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      step >= 3
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    3
                  </div>
                  <div
                    className={`w-8 h-1 rounded-full transition-all duration-300 ${
                      step >= 4 ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
                    }`}
                  ></div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      step >= 4
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    4
                  </div>
                </div>
              </div>

              {step === 1 ? (
                <form onSubmit={handleNextStep} className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
                    What&apos;s your email?
                  </h2>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="relative group">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                    />
                  </div>

                  {/* Next Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? "Checking Email..." : "Next"}
                  </button>

                  {/* Back to Login */}
                  <div className="text-center">
                    <Link
                      href="/login"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 hover:underline underline-offset-4"
                    >
                      Already have an account? Sign in
                    </Link>
                  </div>
                </form>
              ) : step === 2 ? (
                <form onSubmit={handleStep2Next} className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Tell us about yourself
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {email}
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-300 dark:hover:border-gray-500 group-hover:shadow-md"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-300 dark:hover:border-gray-500 group-hover:shadow-md"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Username Input */}
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-300 dark:hover:border-gray-500 group-hover:shadow-md"
                    />

                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>

                  {/* Location Input */}
                  <div className="relative group">
                    <CityLocationPicker
                      value={locationData}
                      onChange={setLocationData}
                      placeholder="Search for your city..."
                      mapTilerApiKey={process.env.NEXT_PUBLIC_MAPTILER_API_KEY}
                      className="group-hover:shadow-md"
                      disabled={isLoading}
                      required={true}
                      error={
                        error && !locationData ? "Location is required" : ""
                      }
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative z-10">Next</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                      className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      Back
                    </button>
                  </div>
                </form>
              ) : step === 3 ? (
                <form onSubmit={handleStep3Next} className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Sports & Security
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {firstName} {lastName} • {email}
                      {locationData && (
                        <span> • {locationData.displayName}</span>
                      )}
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Sports Selection - Inline Tag Input */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sports Interests
                    </label>

                    {/* Combined Tags and Input */}
                    <div className="relative">
                      <div className="min-h-[60px] p-3 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-300">
                        <div className="flex flex-wrap gap-2 items-center">
                          {/* Selected Sports Tags */}
                          {sports.map((sport) => (
                            <span
                              key={sport}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 group"
                            >
                              {sport}
                              <button
                                type="button"
                                onClick={() => handleSportRemove(sport)}
                                className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 focus:outline-none"
                              >
                                ×
                              </button>
                            </span>
                          ))}

                          {/* Inline Input */}
                          <input
                            type="text"
                            placeholder={
                              loadingSports
                                ? "Loading sports..."
                                : sports.length === 0
                                  ? "Type to add sports..."
                                  : "Add more..."
                            }
                            value={sportInput}
                            onChange={(e) => setSportInput(e.target.value)}
                            onKeyDown={handleSportInputKeyPress}
                            onFocus={() => setShowSportsDropdown(true)}
                            onBlur={() => {
                              // Delay hiding to allow clicking on dropdown items
                              setTimeout(
                                () => setShowSportsDropdown(false),
                                150,
                              );
                            }}
                            disabled={loadingSports}
                            className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                          />
                        </div>
                      </div>

                      {/* Filtered Sports Dropdown (when typing) */}
                      {sportInput && getFilteredSports().length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                          {getFilteredSports()
                            .slice(0, 8)
                            .map((sport) => (
                              <button
                                key={sport}
                                type="button"
                                onClick={() => handleSportAdd(sport)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl"
                              >
                                {sport}
                              </button>
                            ))}
                        </div>
                      )}

                      {/* All Sports Dropdown */}
                      {showSportsDropdown &&
                        !sportInput &&
                        !loadingSports &&
                        getAvailableSports().length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                              Available Sports
                            </div>
                            <div className="grid grid-cols-2 gap-1 p-2">
                              {getAvailableSports().map((sport) => (
                                <button
                                  key={sport}
                                  type="button"
                                  onMouseDown={() => handleSportAdd(sport)}
                                  className="px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 rounded-lg text-sm"
                                >
                                  {sport}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Loading Sports Dropdown */}
                      {showSportsDropdown && !sportInput && loadingSports && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-4">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              Loading sports...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Selected: {sports.length} sport
                      {sports.length !== 1 ? "s" : ""} • Type to search, press
                      Enter to add, or use backspace to remove
                    </p>
                  </div>

                  {/* Password Input */}
                  <div className="relative group">
                    <input
                      type="password"
                      placeholder="Password (minimum 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-300 dark:hover:border-gray-500 group-hover:shadow-md"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="relative group">
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-300 dark:hover:border-gray-500 group-hover:shadow-md"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative z-10">
                        {isLoading ? "Checking Username..." : "Next"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={isLoading}
                      className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      Back
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Complete Your Profile
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {firstName} {lastName} • {email}
                      {locationData && (
                        <span> • {locationData.displayName}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Add a profile picture and bio (both optional)
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Profile Picture Upload (Optional) */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                      Profile Picture{" "}
                      <span className="text-gray-500 dark:text-gray-400">
                        (optional)
                      </span>
                    </label>
                    <AvatarUpload
                      onAvatarChange={setAvatar}
                      showUploadButton={false}
                      showDeleteButton={false}
                      size="lg"
                      className="justify-center"
                    />
                  </div>

                  {/* Bio Input (Optional) */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bio{" "}
                      <span className="text-gray-500 dark:text-gray-400">
                        (optional)
                      </span>
                    </label>
                    <div className="relative group">
                      <textarea
                        placeholder="Tell us about yourself, your interests, or what sports you're passionate about..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        maxLength={250}
                        className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-300 dark:hover:border-gray-500 group-hover:shadow-md resize-none"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                      {bio.length}/250 characters
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-500 dark:to-green-600 dark:hover:from-green-600 dark:hover:to-green-700 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative z-10">
                        {isLoading
                          ? "Creating Account..."
                          : "Complete Registration"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={isLoading}
                      className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <Link
            href="/login"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 hover:underline underline-offset-4"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
