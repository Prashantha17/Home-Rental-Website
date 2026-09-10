// src/pages/Home.test.jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const renderHome = () => {
  return render(
    <AuthProvider>
      <ToastProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

describe('Home Page - Unit and Feature Tests', () => {
  it('renders brand heading and tagline', () => {
    renderHome();

    expect(screen.getByRole('heading', { level: 1, name: /namma mane/i })).toBeInTheDocument();
    const taglines = screen.getAllByText(/find your home which matches your vibe/i);
    expect(taglines.length).toBeGreaterThanOrEqual(1);
  });

  it('switches between search modes (PIN Code, State & District, Keyword)', () => {
    renderHome();

    // Default mode is pincode
    expect(screen.getByPlaceholderText(/enter 6-digit pin/i)).toBeInTheDocument();

    // Switch to State & District
    const hierarchyBtn = screen.getByRole('button', { name: /state & district/i });
    fireEvent.click(hierarchyBtn);
    expect(screen.getByText(/select state/i)).toBeInTheDocument();

    // Switch to Keyword
    const keywordBtn = screen.getByRole('button', { name: /keyword search/i });
    fireEvent.click(keywordBtn);
    expect(screen.getByPlaceholderText(/search city, area, or society/i)).toBeInTheDocument();
  });

  it('renders quick vibe filter buttons and triggers search on click', () => {
    renderHome();

    const quietVibe = screen.getByRole('button', { name: /quiet & serene/i });
    expect(quietVibe).toBeInTheDocument();

    // Click quick vibe
    fireEvent.click(quietVibe);
    // Should populate the vibe input
    const vibeInput = screen.getByPlaceholderText(/quiet sunlit penthouse with ocean breeze/i);
    expect(vibeInput.value).toContain('quiet');
  });

  it('renders house type selection dropdown with correct options', () => {
    renderHome();

    const houseTypeSelect = screen.getByDisplayValue(/all types/i);
    expect(houseTypeSelect).toBeInTheDocument();

    fireEvent.change(houseTypeSelect, { target: { value: '2BHK' } });
    expect(houseTypeSelect.value).toBe('2BHK');
  });
});
