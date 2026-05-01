/**
 * publications.js
 * Fetches publications.bib, parses it, and renders publication cards.
 * Depends on bibtex-parser.js being loaded first.
 */

(function () {

  var BIB_PATH = 'publications.bib';
  var _entries = null; // cached parsed entries

  /* ── Type ordering for grouped display ─────────────────── */
  var TYPE_ORDER = [
    { key: 'incollection', label: 'Book Chapters' },
    { key: 'article',      label: 'Journal Papers' },
    { key: 'inproceedings',label: 'Conference Papers' },
    { key: 'workshop',     label: 'Workshop Papers' },
    { key: 'preprint',     label: 'Preprint Papers' },
    { key: 'thesis',       label: 'Theses & Dissertations' }
  ];

  /* ── Helpers ────────────────────────────────────────────── */

  function getDisplayType(entry) {
    var info = BibTeXParser.getTypeInfo(entry);
    // Normalise @misc subtypes
    if (entry.type === 'misc') {
      var t = (entry.type || '').toLowerCase();
      if ((entry.howpublished || '').toLowerCase().indexOf('thesis') !== -1) return 'thesis';
      var customType = entry.type_raw || '';
      // look at parsed field "type" — but our parser stores the BibTeX entry
      // type in entry.type; the BibTeX *field* named "type" ends up as
      // entry["type"] which would collide. Our parser stores the entry type
      // as .type, so let's check the raw field via a workaround: we store
      // a special key below.
    }
    return info.cls;
  }

  function entryDisplayType(entry) {
    var t = entry.type;
    if (t === 'incollection') return 'incollection';
    if (t === 'article')      return 'article';
    if (t === 'inproceedings')return 'inproceedings';
    if (t === 'phdthesis' || t === 'mastersthesis') return 'thesis';
    if (t === 'misc') {
      var hp = (entry.howpublished || '').toLowerCase();
      var tp = (entry.entrytype_field || '').toLowerCase();
      if (hp.indexOf('thesis') !== -1 || tp.indexOf('thesis') !== -1) return 'thesis';
      if (tp.indexOf('preprint') !== -1) return 'preprint';
      if (tp.indexOf('workshop') !== -1) return 'workshop';
      // Try the raw bibtex "type" field stored under bib_type
      var bt = (entry.bib_type || '').toLowerCase();
      if (bt.indexOf('preprint') !== -1) return 'preprint';
      if (bt.indexOf('workshop') !== -1) return 'workshop';
      if (bt.indexOf('thesis') !== -1)   return 'thesis';
      return 'preprint'; // default for @misc
    }
    return 'other';
  }

  /* ── Build a BibTeX citation string ────────────────────── */
  function buildBibTeX(entry) {
    var lines = ['@' + entry.type + '{' + entry.key + ','];
    var skip = ['type', 'key', 'award', 'pdf', 'html', 'bib_type'];
    var fieldOrder = ['author','title','journal','booktitle','howpublished',
                      'school','year','volume','number','pages','publisher',
                      'address','series','editor','note','url'];
    // Output in preferred order first
    fieldOrder.forEach(function (f) {
      if (entry[f] !== undefined && entry[f] !== '' && skip.indexOf(f) === -1) {
        lines.push('  ' + f + ' = {' + entry[f] + '},');
      }
    });
    // Then any remaining fields
    Object.keys(entry).forEach(function (f) {
      if (fieldOrder.indexOf(f) === -1 && skip.indexOf(f) === -1 && entry[f] !== undefined && entry[f] !== '') {
        lines.push('  ' + f + ' = {' + entry[f] + '},');
      }
    });
    // Remove trailing comma from last line
    if (lines.length > 1) {
      lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '');
    }
    lines.push('}');
    return lines.join('\n');
  }

  /* ── Render a single publication card ──────────────────── */
  function renderCard(entry) {
    var info    = BibTeXParser.getTypeInfo(entry);
    var dtype   = entryDisplayType(entry);
    var authors = BibTeXParser.formatAuthors(entry.author || '');
    var venue   = BibTeXParser.getVenue(entry);
    var year    = entry.year || '';
    var title   = entry.title || '(untitled)';
    var note    = entry.note || '';
    var award   = entry.award || '';
    var url     = entry.url || '';
    var pdf     = entry.pdf  || '';
    var html_   = entry.html || '';
    var key     = entry.key;

    var noteHtml = '';
    if (note) noteHtml = '<span class="badge badge-' + (note === 'to be published' ? 'workshop' : 'preprint') + '" style="font-size:.72rem">' + note + '</span>';

    var awardHtml = '';
    if (award) awardHtml = '<span class="badge-award"><i class="fas fa-trophy"></i> ' + award + '</span>';

    var absId = 'abs_' + key;
    var bibId = 'bib_' + key;

    var togglesHtml = '';
    // Abstract toggle only if we have one
    if (entry.abstract) {
      togglesHtml += '<button class="pub-toggle" data-target="' + absId + '">Abstract</button>';
    }
    togglesHtml += '<button class="pub-toggle" data-target="' + bibId + '">BibTeX</button>';
    if (url)   togglesHtml += '<a class="pub-link" href="' + url   + '" target="_blank" rel="noopener">URL</a>';
    if (pdf)   togglesHtml += '<a class="pub-link" href="' + pdf   + '" target="_blank" rel="noopener">PDF</a>';
    if (html_) togglesHtml += '<a class="pub-link" href="' + html_ + '">Details</a>';

    var absPanel = '';
    if (entry.abstract) {
      absPanel = '<div class="pub-panel" id="' + absId + '"><strong>Abstract:</strong> ' + entry.abstract + '</div>';
    }
    var bibPanel = '<div class="pub-panel" id="' + bibId + '"><pre>' + escapeHtml(buildBibTeX(entry)) + '</pre></div>';

    return '<div class="pub-card" data-type="' + dtype + '" data-year="' + year + '" data-text="' + escapeAttr(title + ' ' + (entry.author || '') + ' ' + venue) + '">'
         + '<div class="pub-header">'
         +   '<span class="pub-title">' + title + '</span>'
         +   '<span class="pub-year">' + year + '</span>'
         + '</div>'
         + '<div class="pub-authors">' + authors + '</div>'
         + (venue ? '<div class="pub-venue">' + venue + '</div>' : '')
         + '<div class="pub-footer">'
         +   '<span class="badge badge-' + dtype + '">' + info.label + '</span>'
         +   noteHtml + awardHtml
         +   '<span style="flex:1"></span>'
         +   togglesHtml
         + '</div>'
         + absPanel
         + bibPanel
         + '</div>';
  }

  /* ── Group entries and render full list ─────────────────── */
  function renderGrouped(entries, container) {
    var groups = {};
    TYPE_ORDER.forEach(function (t) { groups[t.key] = []; });
    groups['other'] = [];

    entries.forEach(function (e) {
      var dt = entryDisplayType(e);
      if (groups[dt]) groups[dt].push(e);
      else groups['other'].push(e);
    });

    var html = '';
    var shown = 0;
    TYPE_ORDER.forEach(function (t) {
      var list = groups[t.key];
      if (!list || list.length === 0) return;
      // Sort by year descending
      list.sort(function (a, b) { return (parseInt(b.year) || 0) - (parseInt(a.year) || 0); });
      html += '<div class="pub-type-section" data-section="' + t.key + '">'
            + '<div class="pub-type-heading">' + t.label
            + ' <span class="pub-type-count">' + list.length + '</span></div>';
      list.forEach(function (e) { html += renderCard(e); shown++; });
      html += '</div>';
    });

    container.innerHTML = html || '<p class="no-results">No publications found.</p>';
    updateCount(container, shown);
    attachToggleHandlers(container);
  }

  /* ── Filter logic ───────────────────────────────────────── */
  function applyFilters(entries, container, typeFilter, searchText) {
    var filtered = entries.filter(function (e) {
      // Type filter
      if (typeFilter && typeFilter !== 'all') {
        if (entryDisplayType(e) !== typeFilter) return false;
      }
      // Search
      if (searchText) {
        var q = searchText.toLowerCase();
        var haystack = [e.title, e.author, e.journal, e.booktitle, e.year, e.key].join(' ').toLowerCase();
        if (haystack.indexOf(q) === -1) return false;
      }
      return true;
    });
    renderGrouped(filtered, container);
  }

  function updateCount(container, count) {
    var info = document.getElementById('pub-count-info');
    if (info) info.textContent = count + ' publication' + (count !== 1 ? 's' : '');
  }

  /* ── Toggle abstract / BibTeX panels ───────────────────── */
  function attachToggleHandlers(container) {
    container.querySelectorAll('.pub-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = btn.getAttribute('data-target');
        var panel    = document.getElementById(targetId);
        if (!panel) return;
        var card     = btn.closest('.pub-card');
        var isOpen   = panel.classList.contains('open');
        // Close all panels in this card
        if (card) {
          card.querySelectorAll('.pub-panel').forEach(function (p) { p.classList.remove('open'); });
          card.querySelectorAll('.pub-toggle').forEach(function (b) { b.classList.remove('active'); });
        }
        if (!isOpen) {
          panel.classList.add('open');
          btn.classList.add('active');
        }
      });
    });
  }

  /* ── Escape helpers ─────────────────────────────────────── */
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  /* ── Load & cache BibTeX ────────────────────────────────── */
  function loadBib(callback) {
    if (_entries) { callback(_entries); return; }
    fetch(BIB_PATH)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (text) {
        // Store BibTeX "type" field separately before parsing clobbers it
        // We do a pre-pass to capture the type= field in @misc entries
        var typeFieldMap = {};
        var re = /@misc\s*\{([^,]+),[\s\S]*?type\s*=\s*\{([^}]+)\}/g;
        var m;
        while ((m = re.exec(text)) !== null) {
          typeFieldMap[m[1].trim()] = m[2].trim();
        }
        _entries = BibTeXParser.parse(text);
        _entries.forEach(function (e) {
          if (typeFieldMap[e.key]) e.bib_type = typeFieldMap[e.key];
        });
        callback(_entries);
      })
      .catch(function (err) {
        console.error('Failed to load publications.bib:', err);
      });
  }

  /* ── Public API ─────────────────────────────────────────── */

  /**
   * Render the full interactive publications list into containerID.
   * Expects filter buttons (#pub-search, .filter-btn) on the page.
   */
  window.loadPublications = function (containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<p class="text-muted" style="padding:2rem 0">Loading publications…</p>';

    loadBib(function (entries) {
      var activeType   = 'all';
      var searchText   = '';

      renderGrouped(entries, container);

      // Wire up search
      var searchInput = document.getElementById('pub-search');
      if (searchInput) {
        searchInput.addEventListener('input', function () {
          searchText = this.value.trim();
          applyFilters(entries, container, activeType, searchText);
        });
      }

      // Wire up type filter buttons
      document.querySelectorAll('.filter-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          activeType = btn.getAttribute('data-filter');
          applyFilters(entries, container, activeType, searchText);
        });
      });
    });
  };

  /**
   * Render the N most recent publications (by year) into containerID.
   * Used on the homepage.
   */
  window.loadRecentPublications = function (containerId, n) {
    n = n || 5;
    var container = document.getElementById(containerId);
    if (!container) return;

    loadBib(function (entries) {
      // Filter to peer-reviewed (articles, inproceedings, incollection)
      var peerReviewed = entries.filter(function (e) {
        return ['article', 'inproceedings', 'incollection'].indexOf(e.type) !== -1;
      });
      // Sort by year desc, then by order in file
      peerReviewed.sort(function (a, b) {
        return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
      });
      var recent = peerReviewed.slice(0, n);
      var html = recent.map(function (e) { return renderCard(e); }).join('');
      container.innerHTML = html || '<p class="text-muted">No publications found.</p>';
      attachToggleHandlers(container);
    });
  };

}());
