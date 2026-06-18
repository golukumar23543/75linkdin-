import React, { useState, useEffect, useRef } from 'react';

const REDIRECT_URL = 'https://www.linkedin.com/premium/redeem-v3/?_ed=CwEAAAGcH6VWEK0rMh2GQ8yE7IXp3koQOuODiP-5uUg8Isps4sAK_GWEkq4eEYBSWhvYTiCmtJi0bg&customKey=wb_s&redeemTypeV2=DISCOUNT&upsellOrderOrigin=nonprofit_lss_sncore_marketplace';
const ADMIN_PASS = 'golu@12';

export default function App() {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  
  const [validityTime, setValidityTime] = useState(60);
  const [maxUsage, setMaxUsage] = useState(1);
  const [generatedLink, setGeneratedLink] = useState('');
  
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('❌ Invalid access link');
  const [statusType, setStatusType] = useState<'error' | 'success'>('error');
  const [isRedeemDisabled, setIsRedeemDisabled] = useState(true);
  
  const [tapCount, setTapCount] = useState(0);
  const [tapHint, setTapHint] = useState<{ message: string, style: string } | null>(null);
  const [previewShown, setPreviewShown] = useState(false);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Security initializations
    const preventDefault = (e: Event) => e.preventDefault();
    const preventKeys = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('selectstart', preventDefault);
    document.addEventListener('dragstart', preventDefault);
    document.addEventListener('keydown', preventKeys as any);
    
    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('keydown', preventKeys as any);
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('access');
    setAccessCode(code);
    
    if (code) {
      validateUserLink(code);
    } else {
      setStatusMessage('❌ Invalid access link');
      setStatusType('error');
      setIsRedeemDisabled(true);
    }
  }, []);

  const getLinkUsage = (linkId: string) => {
    const usageData = JSON.parse(localStorage.getItem('linkUsage') || '{}');
    return usageData[linkId] || 0;
  };

  const updateLinkUsage = (linkId: string, newUsage: number) => {
    const usageData = JSON.parse(localStorage.getItem('linkUsage') || '{}');
    usageData[linkId] = newUsage;
    localStorage.setItem('linkUsage', JSON.stringify(usageData));
  };

  const validateUserLink = (code: string) => {
    try {
      const decodedData = JSON.parse(atob(code));
      const { id, expiry, maxUses } = decodedData;
      
      const now = Date.now();
      
      if (!expiry || !maxUses || !id) {
        setStatusMessage('❌ Invalid access link');
        setStatusType('error');
        setIsRedeemDisabled(true);
        return;
      }
      
      if (now > expiry) {
        setStatusMessage('❌ This premium offer has expired');
        setStatusType('error');
        setIsRedeemDisabled(true);
        return;
      }
      
      const currentUsage = getLinkUsage(id);
      
      if (currentUsage >= maxUses) {
        setStatusMessage('❌ This offer has been fully redeemed');
        setStatusType('error');
        setIsRedeemDisabled(true);
        return;
      }
      
      setStatusMessage('✅ Your premium access is ready!');
      setStatusType('success');
      setIsRedeemDisabled(false);
      
    } catch (error) {
      setStatusMessage('❌ Invalid access link');
      setStatusType('error');
      setIsRedeemDisabled(true);
    }
  };

  const showTapHintMessage = (message: string, style = '') => {
    setTapHint({ message, style });
    setTimeout(() => {
      setTapHint(prev => prev?.message === message ? null : prev);
    }, 1500);
  };

  const handleSecretTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);
    
    if (newTapCount === 3 && !previewShown) {
      showTapHintMessage('🔓 2 more taps for admin panel', 'tap-preview');
      setPreviewShown(true);
    } else if (newTapCount === 4) {
      showTapHintMessage('🔓 1 more tap for admin panel', 'tap-preview');
    } else if (newTapCount === 5) {
      setShowPasswordModal(true);
      setTapCount(0);
      setPreviewShown(false);
      return;
    } else {
      showTapHintMessage(`Taps: ${newTapCount}/5`);
    }
    
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      setTapCount(0);
      setPreviewShown(false);
      setTapHint(null);
    }, 3000);
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASS) {
      setIsAdminPanelOpen(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      setTapHint(null);
    } else {
      setPasswordError(true);
    }
  };

  const initiateSecureRedirect = () => {
    if (!accessCode) {
      setStatusMessage('❌ Invalid access link');
      setStatusType('error');
      return;
    }
    
    try {
      const decodedData = JSON.parse(atob(accessCode));
      const { id, expiry, maxUses } = decodedData;
      
      const now = Date.now();
      const currentUsage = getLinkUsage(id);
      
      if (now > expiry) {
        setStatusMessage('❌ This offer has expired');
        setStatusType('error');
        return;
      }
      
      if (currentUsage >= maxUses) {
        setStatusMessage('❌ Maximum usage reached');
        setStatusType('error');
        return;
      }
      
      updateLinkUsage(id, currentUsage + 1);
      
      setStatusMessage('🔒 Initializing secure connection...');
      setStatusType('success');
      setIsRedeemDisabled(true);

      const securityOverlay = document.getElementById('securityOverlay');
      if (securityOverlay) securityOverlay.style.pointerEvents = 'auto';

      setTimeout(() => {
        const hiddenFrame = document.getElementById('hiddenFrame') as HTMLIFrameElement;
        if (hiddenFrame) hiddenFrame.src = REDIRECT_URL;
      }, 1000);

      setTimeout(() => {
        window.location.replace(REDIRECT_URL);
      }, 2000);

    } catch (error) {
      setStatusMessage('❌ Security verification failed');
      setStatusType('error');
      const securityOverlay = document.getElementById('securityOverlay');
      if (securityOverlay) securityOverlay.style.pointerEvents = 'none';
    }
  };

  const generateLink = () => {
    if (!validityTime || validityTime < 1) {
      setAlertMessage('Please enter a valid time (minimum 1 minute)');
      return;
    }
    
    if (!maxUsage || maxUsage < 1) {
      setAlertMessage('Please enter a valid usage count (minimum 1)');
      return;
    }
    
    const linkId = 'link_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    
    const linkData = {
      id: linkId,
      expiry: Date.now() + (validityTime * 60 * 1000),
      maxUses: maxUsage,
      created: Date.now()
    };
    
    const code = btoa(JSON.stringify(linkData));
    const currentUrl = window.location.origin + window.location.pathname;
    const link = `${currentUrl}?access=${code}`;
    
    updateLinkUsage(linkId, 0);
    
    setGeneratedLink(link);
    copyToClipboard(link);
    setAlertMessage(`✅ Premium link generated & copied to clipboard!\n\nTime: ${validityTime} minutes\nMax Uses: ${maxUsage}`);
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  };

  const Modals = () => (
    <>
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 z-[20000] flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-[#0077b5] flex items-center gap-2">
              <span className="text-2xl">🔒</span> Admin Access
            </h2>
            <p className="mb-4 text-gray-600 font-medium">Enter Admin Password:</p>
            <input 
              type="password" 
              autoFocus
              className={`w-full p-3 border-2 ${passwordError ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:border-[#0077b5] focus:outline-none rounded-lg mb-2 transition-colors`}
              value={passwordInput}
              onChange={e => {
                setPasswordInput(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handlePasswordSubmit();
                if (e.key === 'Escape') setShowPasswordModal(false);
              }}
              placeholder="••••••••"
            />
            {passwordError && <p className="text-red-500 text-sm font-medium mb-4 animate-pulse">Incorrect Password!</p>}
            <div className="flex gap-3 justify-end mt-6">
              <button 
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-5 py-2.5 bg-[#0077b5] text-white rounded-lg font-semibold hover:bg-[#004471] transition-colors shadow-md"
                onClick={handlePasswordSubmit}
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {alertMessage && (
        <div className="fixed inset-0 bg-black/60 z-[30000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="whitespace-pre-wrap mb-7 text-gray-800 font-medium leading-relaxed">
              {alertMessage}
            </div>
            <button 
              className="px-8 py-2.5 bg-[#0077b5] text-white rounded-lg font-bold hover:bg-[#004471] transition-colors shadow-md w-full"
              onClick={() => setAlertMessage(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (isAdminPanelOpen) {
    return (
      <div className="fixed inset-0 w-full h-full bg-slate-50 z-[10000] p-6 overflow-y-auto font-sans select-text flex flex-col items-center">
        <Modals />
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-10">
          <div className="text-center mb-8 pb-6 border-b-2 border-gray-100">
            <h1 className="text-[#0077b5] text-2xl font-bold mb-2">🔗 Premium Link Generator</h1>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Secret Admin Panel</p>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-bold text-slate-700 text-sm">⏰ Valid For (Minutes)</label>
            <input 
              type="number" 
              className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-base focus:border-[#0077b5] focus:outline-none transition-colors"
              value={validityTime}
              onChange={e => setValidityTime(parseInt(e.target.value) || 0)}
              min="1"
            />
          </div>
          
          <div className="mb-8">
            <label className="block mb-2 font-bold text-slate-700 text-sm">🔢 Maximum Usage Count</label>
            <input 
              type="number" 
              className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-base focus:border-[#0077b5] focus:outline-none transition-colors"
              value={maxUsage}
              onChange={e => setMaxUsage(parseInt(e.target.value) || 0)}
              min="1"
            />
          </div>
          
          <button 
            className="bg-[#0077b5] text-white py-4 px-8 text-lg font-bold rounded-xl cursor-pointer transition-all hover:bg-[#004471] hover:shadow-lg w-full mb-6"
            onClick={generateLink}
          >
            🚀 Generate Premium Link
          </button>
          
          {generatedLink && (
            <div className="bg-blue-50 border-2 border-dashed border-[#0077b5] rounded-xl p-4 mb-6 break-all text-center font-medium select-text text-sm text-[#004471]">
              {generatedLink}
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            {generatedLink && (
              <button 
                className="flex-1 bg-[#057642] text-white py-3 px-4 text-sm font-bold rounded-xl cursor-pointer transition-all hover:bg-[#034f2c] hover:shadow-md"
                onClick={() => { copyToClipboard(generatedLink); setAlertMessage('✅ Link copied to clipboard!'); }}
              >
                📋 Copy Link
              </button>
            )}
            <button 
              className="flex-1 bg-[#dc3545] text-white py-3 px-4 text-sm font-bold rounded-xl cursor-pointer transition-all hover:bg-[#c82333] hover:shadow-md"
              onClick={() => setIsAdminPanelOpen(false)}
            >
              ❌ Close Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0077b5] to-[#00a0dc] flex items-center justify-center p-5 select-none font-sans">
      <div id="securityOverlay" className="fixed inset-0 w-full h-full bg-transparent z-[9999] pointer-events-none"></div>
      <iframe id="hiddenFrame" className="hidden" title="Secure Frame"></iframe>
      
      <Modals />
      
      {tapHint && (
        <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-sm font-bold tracking-wide transition-opacity duration-300 pointer-events-none z-[1000] text-center min-w-[200px] shadow-xl ${tapHint.style === 'tap-preview' ? 'bg-white text-[#0077b5] border-2 border-[#0077b5]' : 'bg-black/85 text-white'}`} style={{ opacity: 1 }}>
          {tapHint.message}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] max-w-[480px] w-full overflow-hidden text-center relative border border-white/20">
        <div 
          className="absolute top-3 right-3 w-[40px] h-[40px] bg-transparent cursor-pointer z-[100] rounded-full hover:bg-black/5 transition-colors"
          onClick={handleSecretTap}
          title=""
        ></div>
        
        <div className="bg-[#0077b5] text-white py-14 px-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00a0dc]/50 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="text-[72px] font-bold mb-4 select-none relative tracking-tighter leading-none inline-block border-4 border-white/20 rounded-xl px-4 py-1 bg-white/10 backdrop-blur-sm">
            in
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight relative z-10">Premium Access</h1>
          <p className="opacity-90 text-lg font-medium relative z-10">Your exclusive premium link is ready</p>
        </div>
        
        <div className="py-12 px-10 bg-slate-50">
          <div className={`p-4 rounded-xl mb-8 font-semibold text-sm ${statusType === 'success' ? 'bg-[#d4edda] text-[#155724] border border-[#c3e6cb]' : 'bg-[#f8d7da] text-[#721c24] border border-[#f5c6cb]'}`}>
            {statusMessage}
          </div>
          
          <button 
            className="group bg-[#0077b5] text-white py-4 px-12 text-xl font-bold rounded-full border-none cursor-pointer transition-all duration-300 w-full max-w-[300px] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none enabled:hover:bg-[#004471] enabled:hover:-translate-y-1 enabled:hover:shadow-[0_12px_24px_rgba(0,119,181,0.3)] flex items-center justify-center gap-2 mx-auto"
            disabled={isRedeemDisabled}
            onClick={initiateSecureRedirect}
          >
            <span>🚀</span> 
            <span>Redeem Now</span>
          </button>
          
          <p className="text-slate-400 text-xs font-semibold mt-8 tracking-wider uppercase">
            Secure redirect to premium content
          </p>
        </div>
      </div>
    </div>
  );
}
