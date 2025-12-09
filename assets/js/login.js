(function(){
  const SECRET_FALLBACK = "BitRise2025"; // fallback: only used if server validation isn't available
  const MAX_ATTEMPTS = 3;
  const LOCK_DURATION_MS = 30 * 1000; // 30 seconds lockout
  const overlay = document.getElementById('overlay');
  const terminal = document.getElementById('terminal');
  const spinner = document.getElementById('spinner');
  const passInput = document.getElementById('passcode');
  const unlockBtn = document.getElementById('unlockBtn');
  const errorMsg = document.getElementById('errorMsg');
  const container = document.getElementById('mainContainer');
  const greetingText = document.getElementById('greetingText');
  const modalBackdrop = document.getElementById('modalBackdrop');

  let attempts = Number(localStorage.getItem('loginAttempts') || 0);
  let lockUntil = Number(localStorage.getItem('lockUntil') || 0);
  let isLocked = Date.now() < lockUntil;

  // greeting
  function updateGreeting(){
    const now = new Date();
    const h = now.getHours();
    let g = 'Welcome';
    if(h < 5) g = 'Good night, Operator';
    else if(h < 12) g = 'Good morning';
    else if(h < 17) g = 'Good afternoon';
    else g = 'Good evening';
    greetingText.textContent = g;
  }
  updateGreeting();

  // visual enter
  requestAnimationFrame(()=>container.classList.add('enter'));

  // show error
  function showError(text){
    errorMsg.textContent = text || 'Access Denied. Wrong code.';
    errorMsg.style.display = 'block';
    passInput.classList.add('shake');
    setTimeout(()=>passInput.classList.remove('shake'), 600);
  }

  // lockout
  function setLock(durationMs){
    lockUntil = Date.now() + durationMs;
    localStorage.setItem('lockUntil', String(lockUntil));
    isLocked = true;
    unlockBtn.disabled = true;
    container.classList.add('locked');
    showError(`System temporarily locked. Try again in ${Math.ceil(durationMs/1000)}s.`);
    // countdown update
    const timer = setInterval(()=>{
      const remain = lockUntil - Date.now();
      if(remain <= 0){
        clearInterval(timer);
        isLocked = false;
        attempts = 0;
        localStorage.setItem('loginAttempts', String(attempts));
        localStorage.removeItem('lockUntil');
        unlockBtn.disabled = false;
        container.classList.remove('locked');
        errorMsg.style.display = 'none';
      } else {
        showError(`System temporarily locked. Try again in ${Math.ceil(remain/1000)}s.`);
      }
    }, 1000);
  }

  if(isLocked) {
    // re-enable/keep locked until expiry
    setLock(lockUntil - Date.now());
  }

  // Toggle show/hide
  const toggle = document.getElementById('toggleEye');
  toggle.addEventListener('click', ()=>{
    const isPwd = passInput.type === 'password';
    passInput.type = isPwd ? 'text' : 'password';
    toggle.textContent = isPwd ? 'Hide' : 'Show';
    toggle.setAttribute('aria-pressed', String(isPwd));
    passInput.focus();
  });

  // overlay + fake terminal sequence
  async function showVerificationSequence(logLines = []) {
    overlay.classList.add('show');
    spinner.style.display = 'block';
    terminal.style.display = 'none';
    terminal.innerHTML = '';
    await wait(600);

    // show terminal
    spinner.style.display = 'none';
    terminal.style.display = 'block';
    overlay.setAttribute('aria-hidden','false');

    // type each log line
    for(const line of logLines){
      appendTerminalLine(line.text, line.cls || 'info');
      await wait(line.delay || 700);
    }
  }

  function appendTerminalLine(text, cls){
    const div = document.createElement('div');
    div.className = 'line ' + cls;
    div.textContent = text;
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
  }

  // small wait
  function wait(ms){ return new Promise(res => setTimeout(res, ms)); }

  // Attempt validation: try server endpoint first, fallback to local secret
  async function validateCodeRemote(code) {
    // Try calling a validation endpoint. If your backend exists, replace '/api/validate' with your route.
    // Expected: POST {code} -> { ok: true } (JSON)
    try {
      const resp = await fetch('/api/validate', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({code}),
        cache: 'no-store',
      });
      if(!resp.ok) throw new Error('network');
      const json = await resp.json();
      // Expect shape { ok: boolean, message?: string }
      return {valid: Boolean(json.ok), reason: json.message || null, usedServer:true};
    } catch (err) {
      // server not available or failed; use client fallback
      console.warn('Server validate failed, using client fallback. For real security, validate on server.');
      return {valid: code === SECRET_FALLBACK, reason: null, usedServer:false};
    }
  }

  // Main login flow
  async function checkLogin(){
    if(isLocked) {
      showError('System locked. Wait for timeout.');
      return;
    }
    const code = passInput.value.trim();
    if(!code){
      showError('Please enter the secret code.');
      return;
    }

    // disable UI
    unlockBtn.disabled = true;
    passInput.disabled = true;
    errorMsg.style.display = 'none';

    // show fake scan & verification UI
    await showVerificationSequence([
      {text:'Initializing secure channel...', delay:700},
      {text:'Scanning credentials...', delay:800},
      {text:'Verifying member identity...', delay:900},
    ]);

    // call validation (server preferred)
    const remoteResult = await validateCodeRemote(code);

    // show result lines
    if(remoteResult.usedServer){
      appendTerminalLine('AUTH: Server validation completed', 'info');
    } else {
      appendTerminalLine('AUTH: Server unreachable — using local fallback', 'danger');
    }

    await wait(600);

    if(remoteResult.valid){
      appendTerminalLine('AUTH_SUCCESS: Credentials verified', 'success');
      appendTerminalLine('Loading dashboard modules...', 'info');
      await wait(800);
      appendTerminalLine('Redirecting...', 'info');
      // Save access & redirect
      localStorage.setItem('isTeamMember','true');
      // short delay so user sees the terminal
      await wait(700);
      // perform redirect
      window.location.href = 'index.html';
    } else {
      appendTerminalLine('AUTH_FAILURE: Credentials invalid', 'danger');
      attempts++;
      localStorage.setItem('loginAttempts', String(attempts));
      // if exceeded attempts -> lock
      if(attempts >= MAX_ATTEMPTS){
        appendTerminalLine(`Maximum attempts reached. Locking for ${Math.ceil(LOCK_DURATION_MS/1000)}s`, 'danger');
        await wait(500);
        setLock(LOCK_DURATION_MS);
      } else {
        showError('Access Denied. Wrong code.');
      }
      // close overlay after a moment
      await wait(900);
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden','true');
      terminal.style.display = 'none';
      unlockBtn.disabled = false;
      passInput.disabled = false;
      passInput.focus();
    }
  }

  // Hook up button & enter key
  unlockBtn.addEventListener('click', checkLogin);
  passInput.addEventListener('keypress', (e)=>{
    if(e.key === 'Enter') checkLogin();
  });

  // keyboard shortcuts
  document.addEventListener('keydown', (e)=>{
    // Esc clears input
    if(e.key === 'Escape'){
      passInput.value = '';
      errorMsg.style.display = 'none';
    }
    // Ctrl+R or Cmd+R reset attempts (UX-only)
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r'){
      e.preventDefault();
      attempts = 0;
      localStorage.setItem('loginAttempts', String(attempts));
      localStorage.removeItem('lockUntil');
      isLocked = false;
      unlockBtn.disabled = false;
      container.classList.remove('locked');
      errorMsg.style.display = 'none';
    }
  });

  // modal
  const forgotLink = document.getElementById('forgotLink');
  const modalClose = document.getElementById('modalClose');
  forgotLink.addEventListener('click', (e)=>{
    e.preventDefault();
    modalBackdrop.style.display = 'flex';
    modalBackdrop.setAttribute('aria-hidden','false');
  });
  modalClose.addEventListener('click', ()=>{
    modalBackdrop.style.display = 'none';
    modalBackdrop.setAttribute('aria-hidden','true');
  });
  modalBackdrop.addEventListener('click', (ev)=>{
    if(ev.target === modalBackdrop) {
      modalBackdrop.style.display = 'none';
      modalBackdrop.setAttribute('aria-hidden','true');
    }
  });

  // Minimal accessibility: focus first input on load
  passInput.focus();

  // Visual/UX helpers: hide error when typing
  passInput.addEventListener('input', ()=>{ errorMsg.style.display = 'none' });

  // === Particles background ===
  (function particles(){
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    let w=0,h=0, particles=[];
    function resize(){
      const dpr = window.devicePixelRatio || 1;
      w = canvas.width = Math.max(1, innerWidth * dpr);
      h = canvas.height = Math.max(1, innerHeight * dpr);
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      ctx.scale(dpr,dpr);
    }
    function rand(min,max){return Math.random()*(max-min)+min}
    function create(){
      particles = [];
      const count = Math.round((innerWidth * innerHeight) / 60000) + 18;
      for(let i=0;i<count;i++){
        particles.push({
          x: rand(0,innerWidth),
          y: rand(0,innerHeight),
          r: rand(0.6,2.6),
          vx: rand(-0.2,0.2),
          vy: rand(-0.15,0.2),
          glow: rand(0.2,0.95)
        });
      }
    }
    function draw(){
      ctx.clearRect(0,0,innerWidth,innerHeight);
      for(const p of particles){
        p.x += p.vx;
        p.y += p.vy;
        if(p.x < -10) p.x = innerWidth + 10;
        if(p.x > innerWidth + 10) p.x = -10;
        if(p.y < -10) p.y = innerHeight + 10;
        if(p.y > innerHeight + 10) p.y = -10;

        // glow
        ctx.beginPath();
        ctx.fillStyle = `rgba(0,255,170,${0.06 * p.glow})`;
        ctx.arc(p.x, p.y, p.r*6, 0, Math.PI*2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${0.08 * p.glow})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    window.addEventListener('resize', ()=>{
      resize(); create();
    });
    resize(); create(); draw();
  })();

  // small analytics: console note
  console.log('Enhanced Team Login loaded. Reminder: move validation to server for production.');

})();
