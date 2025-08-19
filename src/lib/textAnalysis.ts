// Text analysis utilities for extracting themes and insights from documents

/**
 * Extracts main themes from text using keyword frequency analysis
 */
export function extractMainThemes(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return ['Document Analysis'];
  }

  // Common words to exclude from theme extraction
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'they', 'them', 'their', 'there', 'then', 'than', 'when', 'where', 'why', 'how', 'what', 'who',
    'which', 'while', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off',
    'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just',
    'should', 'now', 'also', 'from', 'into', 'through', 'between', 'among', 'within', 'without',
    'across', 'around', 'behind', 'beside', 'beyond', 'inside', 'outside', 'toward', 'towards',
    'upon', 'within', 'without', 'about', 'against', 'along', 'among', 'around', 'because',
    'become', 'becomes', 'becoming', 'been', 'before', 'being', 'between', 'both', 'but',
    'cannot', 'come', 'comes', 'coming', 'does', 'doing', 'done', 'each', 'either', 'even',
    'every', 'example', 'first', 'get', 'gets', 'getting', 'give', 'gives', 'giving', 'go',
    'goes', 'going', 'gone', 'good', 'great', 'group', 'however', 'important', 'include',
    'includes', 'including', 'instead', 'know', 'knows', 'knowing', 'known', 'large', 'last',
    'later', 'less', 'let', 'like', 'little', 'long', 'look', 'looks', 'looking', 'made',
    'make', 'makes', 'making', 'many', 'much', 'must', 'need', 'needs', 'needing', 'new',
    'next', 'number', 'often', 'old', 'one', 'open', 'order', 'part', 'people', 'place',
    'point', 'possible', 'present', 'problem', 'provide', 'provides', 'providing', 'put',
    'puts', 'putting', 'right', 'said', 'same', 'say', 'says', 'saying', 'see', 'sees',
    'seeing', 'seem', 'seems', 'seeming', 'several', 'show', 'shows', 'showing', 'since',
    'small', 'state', 'still', 'such', 'system', 'take', 'takes', 'taking', 'tell', 'tells',
    'telling', 'think', 'thinks', 'thinking', 'three', 'time', 'times', 'today', 'together',
    'turn', 'turns', 'turning', 'two', 'under', 'until', 'use', 'used', 'uses', 'using',
    'want', 'wants', 'wanting', 'way', 'ways', 'well', 'went', 'work', 'works', 'working',
    'year', 'years', 'yet', 'young'
  ]);

  // Clean and tokenize text
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Count word frequencies
  const wordFreq = words.reduce((freq, word) => {
    freq[word] = (freq[word] || 0) + 1;
    return freq;
  }, {} as Record<string, number>);

  // Extract top themes based on frequency
  const themes = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([word]) => word)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)); // Capitalize

  // If no themes found, return generic ones
  if (themes.length === 0) {
    return ['Document Analysis', 'Content Review'];
  }

  // Add some domain-specific theme detection
  const textLower = text.toLowerCase();
  const domainThemes: string[] = [];

  if (textLower.includes('artificial intelligence') || textLower.includes('machine learning') || textLower.includes('neural network')) {
    domainThemes.push('Artificial Intelligence');
  }
  if (textLower.includes('healthcare') || textLower.includes('medical') || textLower.includes('patient')) {
    domainThemes.push('Healthcare');
  }
  if (textLower.includes('business') || textLower.includes('management') || textLower.includes('strategy')) {
    domainThemes.push('Business Strategy');
  }
  if (textLower.includes('research') || textLower.includes('study') || textLower.includes('analysis')) {
    domainThemes.push('Research');
  }
  if (textLower.includes('technology') || textLower.includes('software') || textLower.includes('digital')) {
    domainThemes.push('Technology');
  }
  if (textLower.includes('education') || textLower.includes('learning') || textLower.includes('student')) {
    domainThemes.push('Education');
  }

  // Combine domain themes with frequency-based themes
  const combinedThemes = [...domainThemes, ...themes];
  
  // Remove duplicates and return top 6 themes
  return Array.from(new Set(combinedThemes)).slice(0, 6);
}

/**
 * Extracts key terms from text for contextual analysis
 */
export function extractKeyTerms(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));
  
  const wordFreq = words.reduce((freq, word) => {
    freq[word] = (freq[word] || 0) + 1;
    return freq;
  }, {} as Record<string, number>);
  
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Analyzes text complexity and readability
 */
export function analyzeTextComplexity(text: string) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  
  const complexity = avgWordsPerSentence > 20 ? 'complex' : 
                    avgWordsPerSentence > 12 ? 'moderate' : 'simple';
  
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    complexity,
    readingLevel: complexity === 'complex' ? 'Advanced' : 
                  complexity === 'moderate' ? 'Intermediate' : 'Beginner'
  };
}