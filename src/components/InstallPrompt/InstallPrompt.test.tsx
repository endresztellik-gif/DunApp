import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstallPrompt } from './InstallPrompt';

// Mock BeforeInstallPromptEvent
interface MockBeforeInstallPromptEvent {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  preventDefault: () => void;
}

describe('InstallPrompt', () => {
  let mockPromptEvent: MockBeforeInstallPromptEvent;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Mock the beforeinstallprompt event
    mockPromptEvent = {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
      preventDefault: vi.fn()
    };
  });

  it('should not render initially', () => {
    render(<InstallPrompt />);
    expect(screen.queryByText(/Telepítsd a DunApp-ot/i)).not.toBeInTheDocument();
  });

  it('should render when beforeinstallprompt event fires', async () => {
    render(<InstallPrompt />);

    // Simulate beforeinstallprompt event
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), mockPromptEvent)
    );

    await waitFor(() => {
      expect(screen.getByText(/Telepítsd a DunApp-ot/i)).toBeInTheDocument();
    });
  });

  it('should call prompt() when install button clicked', async () => {
    render(<InstallPrompt />);

    // Trigger event
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), mockPromptEvent)
    );

    await waitFor(() => {
      expect(screen.getByText(/Telepítés/i)).toBeInTheDocument();
    });

    // Click install button
    fireEvent.click(screen.getByText(/Telepítés/i));

    await waitFor(() => {
      expect(mockPromptEvent.prompt).toHaveBeenCalled();
    });
  });

  it('should hide when "Később" button clicked', async () => {
    render(<InstallPrompt />);

    // Trigger event
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), mockPromptEvent)
    );

    await waitFor(() => {
      expect(screen.getByText(/Később/i)).toBeInTheDocument();
    });

    // Click "Később" button
    fireEvent.click(screen.getByText(/Később/i));

    await waitFor(() => {
      expect(screen.queryByText(/Telepítsd a DunApp-ot/i)).not.toBeInTheDocument();
    });
  });

  it('should remember dismissal in localStorage', async () => {
    render(<InstallPrompt />);

    // Trigger event
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), mockPromptEvent)
    );

    await waitFor(() => {
      expect(screen.getByText(/Ne mutasd újra/i)).toBeInTheDocument();
    });

    // Click dismiss button
    fireEvent.click(screen.getByText(/Ne mutasd újra/i));

    await waitFor(() => {
      expect(localStorage.getItem('pwa-install-dismissed')).toBe('true');
    });
  });

  it('should not render if previously dismissed', () => {
    // Set dismissal flag
    localStorage.setItem('pwa-install-dismissed', 'true');

    render(<InstallPrompt />);

    // Trigger event
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), mockPromptEvent)
    );

    // Should not render
    expect(screen.queryByText(/Telepítsd a DunApp-ot/i)).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', async () => {
    render(<InstallPrompt />);

    // Trigger event
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), mockPromptEvent)
    );

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-labelledby', 'install-prompt-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'install-prompt-description');
    });
  });

  it('should close when X button clicked', async () => {
    render(<InstallPrompt />);

    // Trigger event
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), mockPromptEvent)
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Bezárás')).toBeInTheDocument();
    });

    // Click close button
    fireEvent.click(screen.getByLabelText('Bezárás'));

    await waitFor(() => {
      expect(screen.queryByText(/Telepítsd a DunApp-ot/i)).not.toBeInTheDocument();
    });
  });

  it('should display benefits list', async () => {
    render(<InstallPrompt />);

    // Trigger event
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), mockPromptEvent)
    );

    await waitFor(() => {
      expect(screen.getByText(/Offline hozzáférés/i)).toBeInTheDocument();
      expect(screen.getByText(/Gyorsabb betöltés/i)).toBeInTheDocument();
      expect(screen.getByText(/Teljes képernyős mód/i)).toBeInTheDocument();
    });
  });
});
