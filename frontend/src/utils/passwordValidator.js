// src/utils/passwordValidator.js

/**
 * Strict Password Validation Rules:
 * 1. Minimum 8 characters, Maximum 12 characters.
 * 2. At least one capital (uppercase) letter (A-Z).
 * 3. At least one number (0-9).
 * 4. At least one special character (!@#$%^&*...).
 *
 * Returns { isValid, message, rules: { length, hasUpper, hasNumber, hasSpecial } }
 */
export const validatePassword = (password) => {
  const pwd = password || "";

  const length = pwd.length >= 8 && pwd.length <= 12;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>[\]\\\/_~`\-+=;']/.test(pwd);

  const isValid = length && hasUpper && hasNumber && hasSpecial;

  let message = "";
  if (!pwd) {
    message = "Password is required.";
  } else if (!isValid) {
    const missing = [];
    if (!length) missing.push("8-12 characters");
    if (!hasUpper) missing.push("at least one capital letter (A-Z)");
    if (!hasNumber) missing.push("at least one number (0-9)");
    if (!hasSpecial) missing.push("at least one special character (!@#$%^&*)");
    message = `Password must contain: ${missing.join(", ")}.`;
  }

  return {
    isValid,
    message,
    rules: {
      length,
      hasUpper,
      hasNumber,
      hasSpecial,
    },
  };
};
