import { useColistraQuery } from '../../shared/colistra/useColistraQuery';

/** Labels bought and amount charged since the start of the month. */
export function useMonthlyUsage() {
  return useColistraQuery((colistra) => colistra.account.retrieve(), []);
}
