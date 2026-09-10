// src/components/PasswordRequirements.jsx
import React from "react";
import { validatePassword } from "../utils/passwordValidator";

export const PasswordRequirements = ({ password, showOnlyWhenTyping = true }) => {
  if (showOnlyWhenTyping && (!password || password.length === 0)) {
    return null;
  }

  const { rules, isValid } = validatePassword(password);

  const criteria = [
    {
      id: "length",
      label: "8 to 12 characters",
      met: rules.length,
    },
    {
      id: "upper",
      label: "At least one capital letter (A-Z)",
      met: rules.hasUpper,
    },
    {
      id: "number",
      label: "At least one number (0-9)",
      met: rules.hasNumber,
    },
    {
      id: "special",
      label: "At least one special character (!@#$%^&*)",
      met: rules.hasSpecial,
    },
  ];

  return (
    <div className="mt-2.5 p-3 rounded-xl bg-[#f0f4f9] border border-[#c4c6cf]/60 text-xs transition-all animate-fadeIn">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-[#111c2c] text-[11px] uppercase tracking-wider">
          Password Requirements
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
            isValid
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-amber-100 text-amber-800 border border-amber-300"
          }`}
        >
          {isValid ? "All Criteria Satisfied ✓" : "Requirements Incomplete"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {criteria.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-1.5 transition-colors ${
              item.met ? "text-green-700 font-semibold" : "text-[#74777f]"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                item.met
                  ? "bg-green-600 text-white shadow-xs"
                  : "bg-[#e2e8f0] text-[#74777f]"
              }`}
            >
              {item.met ? "✓" : "•"}
            </span>
            <span className="text-[11px] leading-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordRequirements;
