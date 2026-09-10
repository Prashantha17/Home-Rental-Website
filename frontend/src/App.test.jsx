// src/App.test.js
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock scrollIntoView which is not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Namma Mane - Core Application Integration Tests', () => {
  it('renders the Namma Mane application with navigation brand', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // Verify Brand Logo in Navbar
    const brandLinks = screen.getAllByRole('link', { name: /namma mane/i });
    expect(brandLinks.length).toBeGreaterThan(0);

    // Verify Main Hero Title
    const heroTitle = screen.getByRole('heading', { level: 1, name: /namma mane/i });
    expect(heroTitle).toBeInTheDocument();

    // Verify Tagline (renders in Hero and Footer)
    const taglines = screen.getAllByText(/find your home which matches your vibe/i);
    expect(taglines.length).toBeGreaterThanOrEqual(1);
  });

  it('renders all three location search mode tabs in Hero section', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /by pin code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /state & district/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keyword search/i })).toBeInTheDocument();
  });

  it('renders the dedicated Down-Side AI Vibe Search section and chips', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // Check Down-Side Vibe Search Header
    expect(screen.getByText(/ai lifestyle & vibe search/i)).toBeInTheDocument();

    // Check Quick Vibe Chips
    expect(screen.getByRole('button', { name: /quiet & serene/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /wfh & fast wifi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sea breeze & balcony/i })).toBeInTheDocument();
  });

  it('renders the floating Right-Side Vibe Search trigger', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    const rightSideBtn = screen.getByRole('button', { name: /vibe search/i });
    expect(rightSideBtn).toBeInTheDocument();
  });
});
