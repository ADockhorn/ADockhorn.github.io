/**
 * bibtex-parser.js
 * Lightweight BibTeX parser for client-side use.
 * Handles the standard fields used by this website.
 */

(function (global) {

  /**
   * Parse a BibTeX string and return an array of entry objects.
   * Each object has: { type, key, ...fieldValues }
   */
  function parseBibTeX(text) {
    var entries = [];
    // Strip comments (lines starting with %)
    text = text.replace(/^%.*$/gm, '');

    var i = 0;
    while (i < text.length) {
      // Find next @
      var at = text.indexOf('@', i);
      if (at === -1) break;

      i = at + 1;

      // Read entry type
      var typeMatch = text.slice(i).match(/^(\w+)\s*\{/);
      if (!typeMatch) continue;
      var type = typeMatch[1].toLowerCase();
      i += typeMatch[0].length;

      // Now we are right after the opening brace of the entry.
      // Read until the matching closing brace.
      var depth = 1;
      var entryContent = '';
      while (i < text.length && depth > 0) {
        var ch = text[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        if (depth > 0) entryContent += ch;
        i++;
      }

      // entryContent is now everything inside @type{ ... }
      // First token before the first comma is the key
      var commaIdx = entryContent.indexOf(',');
      if (commaIdx === -1) continue;
      var key = entryContent.slice(0, commaIdx).trim();
      var fieldsText = entryContent.slice(commaIdx + 1);

      var fields = parseFields(fieldsText);
      fields.type = type;
      fields.key  = key;
      entries.push(fields);
    }
    return entries;
  }

  /**
   * Parse the fields portion of a BibTeX entry.
   * Returns an object mapping fieldname -> value string.
   */
  function parseFields(text) {
    var result = {};
    var i = 0;
    while (i < text.length) {
      // Skip whitespace and commas
      while (i < text.length && (text[i] === ',' || text[i] === '\n' || text[i] === '\r' || text[i] === ' ' || text[i] === '\t')) i++;
      if (i >= text.length) break;

      // Read field name
      var nameMatch = text.slice(i).match(/^(\w+)\s*=/);
      if (!nameMatch) { i++; continue; }
      var name = nameMatch[1].toLowerCase();
      i += nameMatch[0].length;

      // Skip whitespace
      while (i < text.length && (text[i] === ' ' || text[i] === '\t' || text[i] === '\n' || text[i] === '\r')) i++;
      if (i >= text.length) break;

      // Read value: either {…} or "…"
      var value = '';
      if (text[i] === '{') {
        i++; // skip opening brace
        var depth = 1;
        while (i < text.length && depth > 0) {
          if (text[i] === '{') depth++;
          else if (text[i] === '}') depth--;
          if (depth > 0) value += text[i];
          i++;
        }
      } else if (text[i] === '"') {
        i++; // skip opening quote
        while (i < text.length && text[i] !== '"') {
          value += text[i];
          i++;
        }
        i++; // skip closing quote
      } else {
        // Bare value (number or string constant) — read until comma or end
        while (i < text.length && text[i] !== ',' && text[i] !== '\n') {
          value += text[i];
          i++;
        }
        value = value.trim();
      }

      result[name] = cleanLatex(value);
    }
    return result;
  }

  /**
   * Convert common LaTeX markup to plain text / HTML.
   */
  function cleanLatex(str) {
    if (!str) return '';
    // German umlauts encoded as {\"x}
    str = str.replace(/\{\\"\{?a\}?\}/g, 'ä')
             .replace(/\{\\"\{?o\}?\}/g, 'ö')
             .replace(/\{\\"\{?u\}?\}/g, 'ü')
             .replace(/\{\\"\{?A\}?\}/g, 'Ä')
             .replace(/\{\\"\{?O\}?\}/g, 'Ö')
             .replace(/\{\\"\{?U\}?\}/g, 'Ü')
             .replace(/\{\\ss\}/g, 'ß')
             .replace(/\\ss/g, 'ß');
    // Accents: \'e → é etc.
    str = str.replace(/\\'\{?e\}?/g, 'é')
             .replace(/\\'\{?a\}?/g, 'á')
             .replace(/\\`\{?e\}?/g, 'è')
             .replace(/\\\^o/g, 'ô');
    // Bold / italic
    str = str.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
    str = str.replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>');
    str = str.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>');
    // em-dashes
    str = str.replace(/---/g, '—').replace(/--/g, '–');
    // Remove remaining braces
    str = str.replace(/[{}]/g, '');
    // Normalise whitespace
    str = str.replace(/\s+/g, ' ').trim();
    return str;
  }

  /**
   * Format an author string "Last, First and Last, First and …"
   * Bolds "Dockhorn, Alexander" (the site owner).
   */
  function formatAuthors(authorStr) {
    if (!authorStr) return '';
    var authors = authorStr.split(' and ').map(function (a) {
      a = a.trim();
      // Convert "Last, First" → "First Last"
      var parts = a.split(',');
      if (parts.length === 2) {
        a = parts[1].trim() + ' ' + parts[0].trim();
      }
      // Bold the site owner
      if (/dockhorn/i.test(a)) {
        return '<strong>' + a + '</strong>';
      }
      return a;
    });
    return authors.join(', ');
  }

  /**
   * Get a human-readable venue string from an entry.
   */
  function getVenue(entry) {
    return entry.journal || entry.booktitle || entry.howpublished || entry.school || '';
  }

  /**
   * Return the display type label and CSS class for an entry.
   */
  function getTypeInfo(entry) {
    var t = entry.type;
    var customType = (entry.type_field || '').toLowerCase();
    if (t === 'incollection') return { label: 'Book Chapter', cls: 'book' };
    if (t === 'article')      return { label: 'Journal',      cls: 'journal' };
    if (t === 'inproceedings')return { label: 'Conference',   cls: 'conference' };
    if (t === 'phdthesis' || t === 'mastersthesis' || (customType.indexOf('thesis') !== -1))
                              return { label: 'Thesis',       cls: 'thesis' };
    if (customType === 'preprint' || customType === 'preprint paper')
                              return { label: 'Preprint',     cls: 'preprint' };
    if (customType.indexOf('workshop') !== -1)
                              return { label: 'Workshop',     cls: 'workshop' };
    // Default for @misc
    return { label: 'Other', cls: 'preprint' };
  }

  // Expose API globally
  global.BibTeXParser = {
    parse: parseBibTeX,
    formatAuthors: formatAuthors,
    getVenue: getVenue,
    getTypeInfo: getTypeInfo
  };

}(typeof window !== 'undefined' ? window : this));
