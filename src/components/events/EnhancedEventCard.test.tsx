import React from 'react';
import { render, userEvent } from '@/test/test-utils';

import { EnhancedEventCard } from './EnhancedEventCard';
import { describe, it, expect, beforeEach, vi } from 'vitest';

function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
  window.dispatchEvent(new Event('resize'));
}

describe('EnhancedEventCard - mobile sticky CTA', () => {
  beforeEach(() => setMobileViewport());

  const baseEvent = {
    id: 'evt_1',
    title: 'Morning Walk & Talk',
    start_time: new Date().toISOString(),
    description: 'Join us for a refreshing morning walk',
    isUpcoming: true,
    isToday: true,
    is_registered: false,
    capacityPercentage: 40,
    current_capacity: 20,
    max_capacity: 50,
  } as any;

  it('renders sticky mobile CTA and triggers register', async () => {
    const onRegister = vi.fn();

    const { findByTestId, getByTestId } = render(
      <EnhancedEventCard event={baseEvent} onRegister={onRegister} />
    );

    const cta = await findByTestId('mobile-sticky-cta');
    expect(cta).toBeInTheDocument();

    await userEvent.click(getByTestId('mobile-register-button'));
    expect(onRegister).toHaveBeenCalledWith('evt_1');
  });

  it('opens details dialog when no onViewDetails is provided and shows footer CTA', async () => {
    const utils = render(<EnhancedEventCard event={baseEvent} />);

    // Click the Details button
    await userEvent.click(utils.getByRole('button', { name: /details/i }));

    // Footer CTA should be present in dialog
    const dialogCta = await utils.findByTestId('details-register-button');
    expect(dialogCta).toBeInTheDocument();
  });
});
