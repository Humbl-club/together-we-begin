import React from 'react';
import { render, userEvent } from '@/test/test-utils';
import { screen } from '@testing-library/react';
import { EventCardPresentation } from './EventCardPresentation';
import { describe, it, expect, beforeEach } from 'vitest';

function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
  window.dispatchEvent(new Event('resize'));
}

describe('EventCardPresentation - mobile sticky CTA', () => {
  beforeEach(() => setMobileViewport());

  const baseEvent = {
    id: 'evt_2',
    title: 'Yoga & Breathwork',
    start_time: new Date().toISOString(),
    description: 'Gentle yoga practice for all levels',
    isUpcoming: true,
    isToday: false,
    is_registered: false,
    capacityPercentage: 10,
    current_capacity: 5,
    max_capacity: 50,
  } as any;

  it('renders sticky CTA and calls onRegister', async () => {
    const onRegister = vi.fn();

    render(
      <EventCardPresentation event={baseEvent} onRegister={onRegister} />
    );

    const cta = await screen.findByTestId('mobile-sticky-cta');
    expect(cta).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('mobile-register-button'));
    expect(onRegister).toHaveBeenCalledWith('evt_2');
  });
});
