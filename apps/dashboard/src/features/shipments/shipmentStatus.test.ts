import { SHIPMENT_STATUSES } from '@colistra/sdk';
import { describe, expect, it } from 'vitest';
import { getStatusDisplay, STATUS_DISPLAY } from './shipmentStatus';

describe('shipment status display', () => {
  it('has a label for every Colistra status', () => {
    for (const status of SHIPMENT_STATUSES) {
      expect(STATUS_DISPLAY[status], `missing display for "${status}"`).toBeDefined();
    }
  });

  it('flags exceptions in red', () => {
    expect(getStatusDisplay('exception')).toEqual({ label: 'Problem', tone: 'danger' });
  });

  it('falls back to the raw status for unknown values', () => {
    expect(getStatusDisplay('lost_in_space').label).toBe('lost_in_space');
  });
});
