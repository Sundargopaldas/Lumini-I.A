/**
 * Simple OFX Parser for Node.js
 * Extracts transactions from OFX/SGML content
 */

const parseOFX = (ofxData) => {
  const transactions = [];
  
  // Normalize line endings
  const data = ofxData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Regex to find transaction blocks
  const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  
  let match;
  while ((match = transactionRegex.exec(data)) !== null) {
    const block = match[1];
    
    const typeMatch = block.match(/<TRNTYPE>(.*)/);
    const dateMatch = block.match(/<DTPOSTED>(.*)/);
    const amountMatch = block.match(/<TRNAMT>(.*)/);
    const idMatch = block.match(/<FITID>(.*)/);
    const memoMatch = block.match(/<MEMO>(.*)/);
    
    if (typeMatch && dateMatch && amountMatch && idMatch) {
      const rawDate = dateMatch[1].trim().substring(0, 8); // YYYYMMDD
      const date = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
      
      const rawAmount = parseFloat(amountMatch[1].trim());
      const type = rawAmount >= 0 ? 'income' : 'expense';
      
      transactions.push({
        fitId: idMatch[1].trim(),
        date: date,
        amount: Math.abs(rawAmount), // Store absolute value, type determines sign
        type: type,
        description: memoMatch ? memoMatch[1].trim() : 'OFX Import',
        rawType: typeMatch[1].trim()
      });
    }
  }

  return transactions;
};

module.exports = { parseOFX };
