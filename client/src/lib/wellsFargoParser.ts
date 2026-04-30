// Wells Fargo CSV Parser
// Format: DATE, DESCRIPTION, AMOUNT, CHECK #, STATUS
// Date format: MM/DD/YYYY
// Amounts: negative = expense, positive = income
// Status: only import "Posted" transactions

export interface WellsFargoRow {
  date: string;
  description: string;
  amount: string;
  type: 'expense' | 'income' | 'transfer';
  isIncome: boolean;
}

export function parseWellsFargoCSV(csvText: string): WellsFargoRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file is empty');
  }

  // Validate header
  const header = lines[0].toUpperCase();
  if (!header.includes('DATE') || !header.includes('DESCRIPTION') || 
      !header.includes('AMOUNT') || !header.includes('STATUS')) {
    throw new Error('CSV format not recognized. Expected Wells Fargo format with: DATE, DESCRIPTION, AMOUNT, STATUS');
  }

  // Find column indices
  const headerParts = lines[0].split(',').map(h => h.trim().toUpperCase());
  const dateIdx = headerParts.findIndex(h => h.includes('DATE'));
  const descIdx = headerParts.findIndex(h => h.includes('DESCRIPTION'));
  const amountIdx = headerParts.findIndex(h => h.includes('AMOUNT'));
  const statusIdx = headerParts.findIndex(h => h.includes('STATUS'));

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1 || statusIdx === -1) {
    throw new Error('CSV columns not found. Expected: DATE, DESCRIPTION, AMOUNT, STATUS');
  }

  const results: WellsFargoRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim().replace(/^"(.*)"$/, '$1'));
    
    if (parts.length <= Math.max(dateIdx, descIdx, amountIdx, statusIdx)) continue;

    const status = parts[statusIdx]?.trim();
    if (status !== 'Posted') continue; // Skip non-posted transactions

    const date = parts[dateIdx]?.trim();
    const description = parts[descIdx]?.trim();
    const amountStr = parts[amountIdx]?.trim();

    if (!date || !description || !amountStr) continue;

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) continue;

    const isIncome = amount > 0;
    let type: 'expense' | 'income' | 'transfer' = isIncome ? 'income' : 'expense';

    // Special handling for specific transaction types
    if (description.toUpperCase().includes('ONLINE TRANSFER')) {
      type = 'transfer';
    } else if (description.toUpperCase().includes('INSTANT PMT FROM SQUARE')) {
      type = 'income';
    }

    results.push({
      date,
      description,
      amount: Math.abs(amount).toString(),
      type,
      isIncome,
    });
  }

  if (results.length === 0) {
    throw new Error("No valid 'Posted' transactions found in CSV");
  }

  return results;
}
