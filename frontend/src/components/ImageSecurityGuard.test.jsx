// src/components/ImageSecurityGuard.test.js
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageSecurityGuard from './ImageSecurityGuard';

describe('ImageSecurityGuard - Anti-Download & Security Protection', () => {
  it('renders without crashing', () => {
    render(<ImageSecurityGuard />);
    // Initially the security modal should not be open
    expect(screen.queryByText(/image download restricted/i)).not.toBeInTheDocument();
  });

  it('triggers security modal when right-clicking on an image', () => {
    render(
      <div>
        <ImageSecurityGuard />
        <img src="https://example.com/property.jpg" alt="Test Property" data-testid="protected-img" />
      </div>
    );

    const img = screen.getByTestId('protected-img');

    // Simulate right click (contextmenu event)
    fireEvent.contextMenu(img);

    // Verify modal appeared
    expect(screen.getByText(/image download restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/protected property media/i)).toBeInTheDocument();
    expect(screen.getByText(/protected by namma mane privacy/i)).toBeInTheDocument();
  });

  it('dismisses the security modal when clicking I Understand', () => {
    render(
      <div>
        <ImageSecurityGuard />
        <img src="https://example.com/property.jpg" alt="Test Property" data-testid="protected-img" />
      </div>
    );

    const img = screen.getByTestId('protected-img');
    fireEvent.contextMenu(img);

    // Verify modal is open
    expect(screen.getByText(/image download restricted/i)).toBeInTheDocument();

    // Click "I Understand" button
    const understandBtn = screen.getByRole('button', { name: /i understand/i });
    fireEvent.click(understandBtn);

    // Verify modal is dismissed
    expect(screen.queryByText(/image download restricted/i)).not.toBeInTheDocument();
  });
});
