// This service simulates interactions with a Mobile Money (MoMo) API.
// In a real application, these functions would call a secure backend that proxies requests to the actual payment gateway.

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Simulates verifying a MoMo number.
 * @param phoneNumber The 9-digit Cameroonian phone number to verify (e.g., '670123456').
 * @returns A promise that resolves with a simulated verification result.
 */
export const verifyMobileMoneyNumber = async (phoneNumber: string): Promise<{ success: boolean; accountHolderName?: string; message: string; }> => {
  await delay(1500);
  if (!/^6\d{8}$/.test(phoneNumber)) {
    return { success: false, message: 'Invalid phone number format.' };
  }
  // Simulate a small chance of failure
  if (Math.random() < 0.1) {
    return { success: false, message: 'Could not verify number. Please check and try again.' };
  }
  // Simulate finding a name
  const names = ['John Doe', 'Mary Lambo', 'Samuel Eto', 'Brenda Biya'];
  const accountHolderName = names[Math.floor(Math.random() * names.length)];
  return { success: true, accountHolderName, message: 'Account verified.' };
};

/**
 * Simulates initiating a disbursement (payout) to a user's MoMo account.
 * @param phoneNumber The verified phone number of the recipient.
 * @param amount The amount of money to send (in XAF).
 * @returns A promise that resolves with a simulated success response.
 */
export const initiateDisbursement = async (phoneNumber: string, amount: number): Promise<{ success: boolean; transactionId?: string; message: string; }> => {
  await delay(2000);
  console.log(`Simulating disbursement of ${amount} XAF to ${phoneNumber}`);
  if (Math.random() < 0.05) { // 5% failure chance
      return { success: false, message: 'Disbursement failed due to a network error.' };
  }
  return { success: true, transactionId: `disburse_txn_${Date.now()}`, message: 'Disbursement initiated.' };
};

/**
 * Simulates initiating a "Request to Pay" (collection) from a user's MoMo account.
 * @param phoneNumber The phone number to request payment from.
 * @param amount The amount to request.
 * @returns A promise that resolves with a simulated success response.
 */
export const requestPayment = async (phoneNumber: string, amount: number): Promise<{ success: boolean; message: string; transactionId: string; }> => {
  await delay(1000);
  console.log(`Simulating request to pay ${amount} XAF from ${phoneNumber}`);
  if (Math.random() < 0.05) { // 5% failure chance
      return { success: false, message: 'Failed to send payment request.', transactionId: '' };
  }
  return { success: true, message: 'Payment request sent. Please confirm on your phone.', transactionId: `rtp_txn_${Date.now()}` };
};
