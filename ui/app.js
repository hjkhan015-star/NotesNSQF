/* ---------------------------------------------------------------------
   Copy-protection.
   NOTE: this deters casual copy/paste. It cannot stop someone determined
   (screenshots, phone photos, disabling JS, OCR). Treat it as a
   deterrent, not a lock.
------------------------------------------------------------------------ */
(function () {
  function applyWatermark() {
    var label = 'For Classroom Use Only \u2014 Do Not Copy';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="260">' +
      '<text x="210" y="140" font-family="Arial, sans-serif" font-size="22" font-weight="bold" ' +
      'fill="rgba(44,62,80,0.13)" text-anchor="middle" transform="rotate(-35 210 140)">' +
      label + '</text></svg>';
    var b64 = btoa(unescape(encodeURIComponent(svg)));
    var bg = 'url("data:image/svg+xml;base64,' + b64 + '")';
    var style = document.createElement('style');
    style.textContent =
      '.notebook-page{ background-image:' + bg + ' !important; ' +
      'background-size:420px 260px; background-repeat:repeat; }\n' +
      '@media print { .notebook-page{ background-image:' + bg + ' !important; } }';
    document.head.appendChild(style);
  }

  function blockCopying() {
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('copy', function (e) { e.preventDefault(); });
    document.addEventListener('cut', function (e) { e.preventDefault(); });
    document.addEventListener('dragstart', function (e) { e.preventDefault(); });
    document.addEventListener('keydown', function (e) {
      var k = e.key ? e.key.toLowerCase() : '';
      var mod = e.ctrlKey || e.metaKey;
      // Block copy/select-all/view-source/save-page shortcuts.
      // Ctrl+P (print) is deliberately NOT blocked - that's the intended
      // export path via the toolbar's own Print button.
      if (mod && ['c', 'x', 'a', 'u', 's'].indexOf(k) !== -1) e.preventDefault();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyWatermark();
    blockCopying();
  });
})();

(function () {
  var CLASS_LABELS = {'9':'Class IX','10':'Class X','11':'Class XI','12':'Class XII'};
  var SUBJ_BTN  = {'auto':'Automotive','es':'Employability'};
  var SUBJ_FULL = {'auto':'Automotive Service Technician','es':'Employability Skills'};
  var books = [].slice.call(document.querySelectorAll('.book'));
  var classBtnWrap = document.getElementById('classBtns');
  var subjBtnWrap  = document.getElementById('subjBtns');
  var moduleList   = document.getElementById('moduleList');
  var hint         = document.getElementById('toolbarHint');
  var printBtn     = document.getElementById('printBtn');
  var compactToggle= document.getElementById('compactToggle');
  var coverTitle   = document.getElementById('coverTitle');
  var coverSub     = document.getElementById('coverSub');
  var state = { cls:null, subj:null };

  function uniq(a){ var o=[]; a.forEach(function(v){ if(o.indexOf(v)===-1)o.push(v); }); return o; }
  var classList = uniq(books.map(function(b){ return b.dataset.class; }));
  var subjList  = uniq(books.map(function(b){ return b.dataset.subject; }));

  function modulesOf(book){ var out=[],i,c; if(!book) return out;
    for(i=0;i<book.children.length;i++){ c=book.children[i]; if(c.classList && c.classList.contains('module')) out.push(c); }
    return out; }
  function activeBook(){ for(var i=0;i<books.length;i++){ if(books[i].dataset.class===state.cls && books[i].dataset.subject===state.subj) return books[i]; } return null; }
  function moduleLabel(m){ var raw=m.dataset.name,h;
    if(!raw){ h=m.querySelector('.unit-header h1')||m.querySelector('.session-title'); raw=h?h.textContent:'Section'; }
    var s=raw.split(':')[0].trim(); if(s.length>26) s=s.slice(0,25)+'…';
    return {short:s, full:raw}; }

  var classBtns={}, subjBtns={};
  classList.forEach(function(c){ var b=document.createElement('button'); b.type='button'; b.className='pick-btn'; b.textContent=CLASS_LABELS[c]||('Class '+c);
    b.addEventListener('click',function(){ select(c,state.subj); }); classBtnWrap.appendChild(b); classBtns[c]=b; });
  subjList.forEach(function(s){ var b=document.createElement('button'); b.type='button'; b.className='pick-btn'; b.textContent=SUBJ_BTN[s]||s;
    b.addEventListener('click',function(){ select(state.cls,s); }); subjBtnWrap.appendChild(b); subjBtns[s]=b; });

  function select(cls,subj){
    if(!cls||!subj) return;
    state.cls=cls; state.subj=subj;
    try{ localStorage.setItem('notes.sel', cls+'|'+subj); }catch(e){}
    Object.keys(classBtns).forEach(function(k){ classBtns[k].classList.toggle('active',k===cls); });
    Object.keys(subjBtns).forEach(function(k){ subjBtns[k].classList.toggle('active',k===subj); });
    books.forEach(function(b){ b.classList.toggle('is-hidden', !(b.dataset.class===cls && b.dataset.subject===subj)); });
    var book=activeBook();
    coverTitle.textContent = CLASS_LABELS[cls]||cls;
    coverSub.textContent   = (SUBJ_FULL[subj]||subj)+' — Session Notes';
    document.title = (book && book.dataset.title) ? book.dataset.title : 'Notes';
    var es = book ? book.querySelector('.empty-state') : null;
    if(es) es.classList.toggle('is-hidden', modulesOf(book).length > 0);
    buildModuleList(book);
  }

  function buildModuleList(book){
    moduleList.innerHTML='';
    modulesOf(book).forEach(function(m){
      var lab=moduleLabel(m);
      var label=document.createElement('label'); label.className='opt-checkbox'; label.title=lab.full;
      var cb=document.createElement('input'); cb.type='checkbox'; cb.checked=true;
      cb.addEventListener('change', function(){ m.classList.toggle('is-hidden', !cb.checked); updateHint(); });
      var span=document.createElement('span'); span.textContent=lab.short;
      label.appendChild(cb); label.appendChild(span); moduleList.appendChild(label);
      m.classList.remove('is-hidden');
    });
    updateHint();
  }

  function setAll(v){
    [].forEach.call(moduleList.querySelectorAll('input'), function(cb){ cb.checked=v; });
    modulesOf(activeBook()).forEach(function(m){ m.classList.toggle('is-hidden', !v); });
    updateHint();
  }
  document.getElementById('modAll').addEventListener('click', function(){ setAll(true); });
  document.getElementById('modNone').addEventListener('click', function(){ setAll(false); });

  function updateHint(){
    var mods=modulesOf(activeBook());
    var shown=mods.filter(function(m){ return !m.classList.contains('is-hidden'); }).length;
    if(mods.length===0){ hint.textContent='ℹ No notes pasted yet for this selection.'; hint.classList.add('warn'); }
    else if(shown===0){ hint.textContent='⚠ Nothing selected — PDF would be empty!'; hint.classList.add('warn'); }
    else { hint.textContent='✓ '+shown+' of '+mods.length+' module(s) in PDF'; hint.classList.remove('warn'); }
  }

  compactToggle.addEventListener('change', function(){
    document.body.classList.toggle('compact', compactToggle.checked);
    try{ localStorage.setItem('notes.compact', compactToggle.checked?'1':'0'); }catch(e){}
  });

  printBtn.addEventListener('click', function(){
    var mods=modulesOf(activeBook());
    if(mods.length===0){ alert('Notes for this class/subject are not pasted yet.'); return; }
    if(!mods.some(function(m){ return !m.classList.contains('is-hidden'); })){ alert('Please select at least one module.'); return; }
    window.print();
  });

  var saved=null, dc, ds;
  try{ saved=localStorage.getItem('notes.sel'); }catch(e){}
  dc = saved ? saved.split('|')[0] : null;
  ds = saved ? saved.split('|')[1] : null;
  if(!dc || classList.indexOf(dc)===-1) dc = classList[0];
  if(!ds || subjList.indexOf(ds)===-1) ds = subjList[0];
  try{ if(localStorage.getItem('notes.compact')==='1'){ compactToggle.checked=true; document.body.classList.add('compact'); } }catch(e){}
  select(dc, ds);
})();
