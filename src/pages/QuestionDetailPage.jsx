import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { mockTutors } from "../mockData";
import { supabase } from "../supabase";
import GuestModal from "../components/GuestModal";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'application/zip',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// Preferred codec order for MediaRecorder — pick the first one the browser supports
const AUDIO_CODECS = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
];

function getSupportedAudioMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const mime of AUDIO_CODECS) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

/** Inline audio player rendered inside a chat bubble */
function VoiceMessage({ fileUrl, isMine }) {
  return (
    <div className={`chat-voice-player ${isMine ? 'chat-voice-mine' : 'chat-voice-theirs'}`}>
      <span className="chat-voice-icon">🎙️</span>
      <audio
        controls
        preload="metadata"
        className="chat-voice-audio"
        src={fileUrl}
      >
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}

/** Renders images, voice, and document attachments inside a bubble */
function FileAttachment({ fileUrl, fileName, fileType, isMine }) {
  if (!fileUrl) return null;

  if (fileType && fileType.startsWith('audio/')) {
    return <VoiceMessage fileUrl={fileUrl} isMine={isMine} />;
  }

  if (fileType && fileType.startsWith('image/')) {
    return (
      <div className="chat-file-image-wrap">
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <img src={fileUrl} alt={fileName || 'image'} className="chat-file-image" />
        </a>
        {fileName && <div className="chat-file-name">{fileName}</div>}
      </div>
    );
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName}
      className="chat-doc-link"
    >
      <span className="chat-doc-icon">📎</span>
      <span className="chat-doc-name">{fileName || 'Download file'}</span>
    </a>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function QuestionDetailPage({ user, onGuestAction }) {
  const { id } = useParams();

  // ── question / bids ──
  const [question, setQuestion]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [accepted, setAccepted]       = useState(false);
  const [bids, setBids]               = useState([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidMessage, setBidMessage]   = useState("");
  const [bidPrice, setBidPrice]       = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);

  // ── payments ──
  const [payments, setPayments]                     = useState([]);
  const [showPaymentModal, setShowPaymentModal]     = useState(false);
  const [paymentMethod, setPaymentMethod]           = useState("CARD");
  const [initiatingPayment, setInitiatingPayment]   = useState(false);
  const [paymentError, setPaymentError]             = useState("");
  const [paymentSuccess, setPaymentSuccess]         = useState(false);

  // ── payment simulation states ──
  const [paymentStep, setPaymentStep]               = useState("SELECT"); // SELECT, DETAILS, PROCESSING, VERIFY, RESULT
  const [paymentPhone, setPaymentPhone]             = useState("");
  const [paymentPin, setPaymentPin]                 = useState("");
  const [cardName, setCardName]                     = useState("");
  const [cardNumber, setCardNumber]                 = useState("");
  const [cardExpiry, setCardExpiry]                 = useState("");
  const [cardCvv, setCardCvv]                       = useState("");
  const [otpCode, setOtpCode]                       = useState("");
  const [simulatedOutcome, setSimulatedOutcome]     = useState(null);
  const [simulatedTxDetails, setSimulatedTxDetails] = useState(null);
  const [processingMessage, setProcessingMessage]   = useState("Processing payment...");

  // ── chat ──
  const [chatMsg, setChatMsg]           = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading]   = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const chatBottomRef = useRef(null);

  // ── file attachment ──
  const fileInputRef  = useRef(null);
  const [selectedFile, setSelectedFile]   = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading]         = useState(false);
  const [uploadError, setUploadError]     = useState(null);

  // ── voice recording ──
  const mediaRecorderRef  = useRef(null);
  const audioChunksRef    = useRef([]);
  const recordTimerRef    = useRef(null);
  const streamRef         = useRef(null);

  const [isRecording, setIsRecording]   = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceBlob, setVoiceBlob]       = useState(null);   // recorded blob ready to send
  const [voiceMime, setVoiceMime]       = useState(null);
  const [micError, setMicError]         = useState(null);   // browser / permission error

  const supportedMime = getSupportedAudioMime();
  const micSupported  = supportedMime !== null;

  // ─── DATA FETCHING ─────────────────────────────────────────────────────────

  const fetchBids = async () => {
    setLoadingBids(true);
    const { data } = await supabase
      .from('bids').select('*').eq('question_id', id)
      .order('created_at', { ascending: false });
    if (data) {
      setBids(data);
      if (data.some(b => b.accepted)) setAccepted(true);
    }
    setLoadingBids(false);
  };

  const fetchMessages = async () => {
    setChatLoading(true);
    const { data } = await supabase
      .from('messages').select('*')
      .eq('question_id', id)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data);
    setChatLoading(false);
  };

  const fetchPayments = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('question_id', id);
    if (data) setPayments(data);
  };

  // ─── SCROLL TO BOTTOM ──────────────────────────────────────────────────────

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // ─── SETUP: QUESTION + REALTIME ───────────────────────────────────────────

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setLoadingBids(true);
      setChatLoading(true);

      try {
        const [qRes, bRes, mRes, pRes] = await Promise.all([
          supabase.from('questions').select('*').eq('id', id).single(),
          supabase.from('bids').select('*').eq('question_id', id).order('created_at', { ascending: false }),
          supabase.from('messages').select('*').eq('question_id', id).order('created_at', { ascending: true }),
          supabase.from('payments').select('*').eq('question_id', id)
        ]);

        if (!qRes.error && qRes.data) {
          setQuestion({
            ...qRes.data,
            isPaid: qRes.data.payment !== null && qRes.data.payment > 0,
            pricePerHour: qRes.data.payment || 0,
            status: qRes.data.status || 'open',
            responses: 0,
            tags: [],
            grade: qRes.data.level,
            studentName: "Student",
            user_id: qRes.data.user_id,
            deadline: qRes.data.deadline || new Date().toISOString()
          });
        }

        if (bRes.data) {
          setBids(bRes.data);
          if (bRes.data.some(b => b.accepted)) setAccepted(true);
        }

        if (mRes.data) {
          setChatMessages(mRes.data);
        }

        if (pRes.data) {
          setPayments(pRes.data);
        }
      } catch (err) {
        console.error("Error loading question detail data:", err);
      } finally {
        setLoading(false);
        setLoadingBids(false);
        setChatLoading(false);
      }
    };

    if (id) {
      fetchAllData();

      // Supabase Realtime — listen for new messages on this question
      const channel = supabase
        .channel(`question-chat-${id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `question_id=eq.${id}` },
          (payload) => {
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              const optimisticIdx = prev.findIndex(
                (m) =>
                  m.sender_id === payload.new.sender_id &&
                  m.message   === payload.new.message &&
                  typeof m.id === 'string' &&
                  m.id.startsWith('opt-')
              );
              if (optimisticIdx !== -1) {
                const updated = [...prev];
                // Replace optimistic with real row (includes file_url, file_type, etc.)
                updated[optimisticIdx] = payload.new;
                return updated;
              }
              return [...prev, payload.new];
            });
          }
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [id]);

  // ─── CLEANUP ON UNMOUNT ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopRecordTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ─── BIDS ──────────────────────────────────────────────────────────────────

  const handleAccept = async (bidId) => {
    if (!user) { setShowModal(true); return; }
    const { error } = await supabase.from('bids').update({ accepted: true }).eq('id', bidId);
    if (!error) { setAccepted(true); fetchBids(); }
    else alert("Error accepting bid.");
  };

  const loadFlutterwaveScript = () => {
    return new Promise((resolve) => {
      if (window.FlutterwaveCheckout) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ─── PAYMENT SIMULATION LOGIC ───
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += value[i];
    }
    setCardNumber(formatted.substring(0, 19));
  };

  const handleCardExpiryChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setCardExpiry(value.substring(0, 5));
  };

  const handleCardCvvChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    setCardCvv(value.substring(0, 3));
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9+\s]/g, '');
    setPaymentPhone(value.substring(0, 15));
  };

  const handlePinChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    setPaymentPin(value.substring(0, 4));
  };

  const handleOtpChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    setOtpCode(value.substring(0, 6));
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    setPaymentError("");

    if (paymentMethod === "CARD") {
      if (!cardName.trim()) {
        setPaymentError("Cardholder name is required.");
        return;
      }
      if (cardNumber.replace(/\s+/g, '').length !== 16) {
        setPaymentError("Card number must be 16 digits.");
        return;
      }
      if (cardExpiry.length !== 5 || !cardExpiry.includes('/')) {
        setPaymentError("Card expiry must be in MM/YY format.");
        return;
      }
      if (cardCvv.length !== 3) {
        setPaymentError("CVV must be 3 digits.");
        return;
      }
    } else {
      const purePhone = paymentPhone.replace(/\s+/g, '');
      if (!paymentPhone.trim()) {
        setPaymentError("Phone number is required.");
        return;
      }
      if (purePhone.length < 9 || purePhone.length > 15) {
        setPaymentError("Please enter a valid phone number (9 to 15 digits).");
        return;
      }
    }

    setPaymentStep("PROCESSING");
    setInitiatingPayment(true);
    setProcessingMessage("Initiating secure connection...");

    setTimeout(() => {
      setProcessingMessage(paymentMethod === "CARD" 
        ? "Verifying card details with issuing bank..." 
        : "Requesting MTN Mobile Money transaction prompt..."
      );
    }, 1200);

    setTimeout(() => {
      setProcessingMessage("Securing transaction tunnel...");
    }, 2400);

    setTimeout(() => {
      setInitiatingPayment(false);
      setPaymentStep("VERIFY");
    }, 3500);
  };

  const triggerOutcome = async () => {
    const acceptedBid = bids.find(b => b.accepted);
    if (!acceptedBid) {
      setPaymentError("No accepted bid found.");
      return;
    }

    // Choose randomly, but weight SUCCESS at 60%
    const rand = Math.random();
    let selected = "SUCCESS";
    if (rand >= 0.6) {
      let availableFailures = [
        "FAILED", 
        "CANCELLED", 
        "INSUFFICIENT_BALANCE", 
        "TIMEOUT", 
        "DECLINED"
      ];
      if (paymentMethod === "CARD") {
        availableFailures.push("INVALID_CARD");
      } else {
        availableFailures.push("PIN_INCORRECT");
      }
      
      const randomIndex = Math.floor(Math.random() * availableFailures.length);
      selected = availableFailures[randomIndex];
    }

    setSimulatedOutcome(selected);

    const amountStr = paymentMethod === 'MTN' 
      ? `UGX ${(acceptedBid.bid_price * 3700).toLocaleString()}` 
      : `USD ${Number(acceptedBid.bid_price).toFixed(2)}`;

    const dateStr = new Date().toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const txRef = `TXN-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`;

    const details = {
      txRef,
      amount: amountStr,
      method: paymentMethod === 'MTN' ? 'MTN Mobile Money' : 'Visa/Mastercard',
      date: dateStr,
      status: selected === "SUCCESS" ? "Completed" : "Failed"
    };

    setSimulatedTxDetails(details);

    if (selected === "SUCCESS") {
      try {
        const { data: newPayment, error: insertErr } = await supabase
          .from('payments')
          .insert({
            question_id: Number(id),
            student_id: user.id,
            tutor_id: acceptedBid.tutor_id,
            amount: Number(acceptedBid.bid_price),
            payment_method: paymentMethod === 'MTN' ? 'MTN Mobile Money' : 'Visa/Mastercard',
            transaction_id: txRef,
            status: 'Completed'
          })
          .select();
          
        if (insertErr) {
          console.error("Supabase insert error:", insertErr);
          throw new Error("Payment saved but UI update failed: " + insertErr.message);
        }
        
        const { error: updateErr } = await supabase
          .from('questions')
          .update({ status: 'in-progress' })
          .eq('id', id);
          
        if (updateErr) {
          console.error("Supabase update error:", updateErr);
        }
        
        if (newPayment && newPayment.length > 0) {
          setPayments(prev => [...(prev || []), newPayment[0]]);
        }
        setQuestion(prev => prev ? { ...prev, status: 'in-progress' } : null);
        setPaymentSuccess(true);
      } catch (err) {
        setPaymentError(err.message || "Failed to process simulated payment on our servers.");
        setSimulatedOutcome("FAILED");
      }
    }
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    setPaymentError("");

    if (paymentMethod === "CARD") {
      if (otpCode.length !== 6) {
        setPaymentError("Please enter a valid 6-digit OTP code.");
        return;
      }
    } else {
      if (paymentPin.length !== 4) {
        setPaymentError("Please enter a valid 4-digit PIN.");
        return;
      }
    }

    setPaymentStep("PROCESSING");
    setInitiatingPayment(true);
    setProcessingMessage("Validating authentication credentials...");

    setTimeout(() => {
      setProcessingMessage("Finalizing transaction settlement...");
    }, 1200);

    setTimeout(async () => {
      await triggerOutcome();
      setInitiatingPayment(false);
      setPaymentStep("RESULT");
    }, 2500);
  };


  const submitBid = async () => {
    if (!user) { setShowModal(true); return; }
    if (!bidMessage.trim()) return;
    setSubmittingBid(true);
    const finalPrice = question.isPaid ? parseFloat(bidPrice || 0) : 0;
    const { error } = await supabase.from('bids').insert({
      question_id: Number(id),
      tutor_id: user.id,
      tutor_name: user.name,
      bid_price: finalPrice,
      message: bidMessage,
    });
    if (!error) {
      setShowBidForm(false);
      setBidMessage("");
      setBidPrice("");
      fetchBids();
    } else {
      alert("Error submitting bid.");
    }
    setSubmittingBid(false);
  };

  // ─── FILE ATTACHMENT ───────────────────────────────────────────────────────

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Unsupported file type. Allowed: images (JPG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX, TXT, ZIP).');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large. Maximum allowed size is 20 MB.');
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    // clear any pending voice clip if user switches to file
    setVoiceBlob(null);
    setVoiceMime(null);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── VOICE RECORDING ──────────────────────────────────────────────────────

  const stopRecordTimer = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const startRecording = async () => {
    if (!user) { setShowModal(true); return; }
    if (!micSupported) {
      setMicError('Voice recording is not supported in this browser. Try Chrome or Firefox.');
      return;
    }
    setMicError(null);
    setUploadError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: supportedMime });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: supportedMime });
        setVoiceBlob(blob);
        setVoiceMime(supportedMime);
        // Release mic
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
      };

      recorder.start(250); // collect chunks every 250 ms
      setIsRecording(true);
      setRecordSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);

    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Microphone permission denied. Please allow access in your browser settings.');
      } else {
        setMicError('Could not access microphone: ' + err.message);
      }
    }
  };

  const stopRecording = () => {
    stopRecordTimer();
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    // clear any selected file if user recorded voice
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelRecording = () => {
    stopRecordTimer();
    setIsRecording(false);
    setRecordSeconds(0);
    audioChunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // suppress onstop handler
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setVoiceBlob(null);
    setVoiceMime(null);
    setMicError(null);
  };

  const discardVoice = () => {
    setVoiceBlob(null);
    setVoiceMime(null);
    setRecordSeconds(0);
  };

  // ─── SHARED UPLOAD HELPER ─────────────────────────────────────────────────

  /**
   * Uploads a File or Blob to chat-files bucket.
   * Returns { fileUrl, fileName, fileType } or throws on error.
   */
  const uploadToStorage = async (blob, fileName, mimeType) => {
    const ext = fileName.split('.').pop();
    const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    setUploadProgress(10);
    const { error: uploadErr } = await supabase.storage
      .from('chat-files')
      .upload(filePath, blob, { cacheControl: '3600', upsert: false, contentType: mimeType });

    if (uploadErr) throw new Error(uploadErr.message);

    setUploadProgress(80);
    const { data: urlData } = supabase.storage.from('chat-files').getPublicUrl(filePath);
    setUploadProgress(100);

    return {
      fileUrl: urlData?.publicUrl || null,
      fileName,
      fileType: mimeType,
    };
  };

  // ─── SEND MESSAGE (text / file / voice / combos) ──────────────────────────

  const sendChat = async () => {
    if (!user) { setShowModal(true); return; }
    const trimmed = chatMsg.trim();
    if (!trimmed && !selectedFile && !voiceBlob) return;
    if (uploading) return; // prevent duplicate submission

    setUploadError(null);
    setUploading(true);
    setUploadProgress(0);

    let fileUrl  = null;
    let fileName = null;
    let fileType = null;

    try {
      // ── Upload voice blob ──────────────────────────────────────────────────
      if (voiceBlob) {
        const ext = voiceMime.includes('ogg') ? 'ogg'
                  : voiceMime.includes('mp4') ? 'mp4'
                  : 'webm';
        const voiceFileName = `voice-${Date.now()}.${ext}`;
        ({ fileUrl, fileName, fileType } = await uploadToStorage(voiceBlob, voiceFileName, voiceMime));
      }
      // ── Upload regular file ────────────────────────────────────────────────
      else if (selectedFile) {
        ({ fileUrl, fileName, fileType } = await uploadToStorage(
          selectedFile, selectedFile.name, selectedFile.type
        ));
      }
    } catch (err) {
      setUploadError('Upload failed: ' + (err.message || 'Unknown error'));
      setUploading(false);
      setUploadProgress(0);
      return;
    }

    // Clear inputs optimistically
    const messageText = trimmed;
    setChatMsg('');
    clearFile();
    discardVoice();
    setUploadProgress(0);

    // Optimistic message
    const tempId = `opt-${Date.now()}-${Math.random()}`;
    const optimisticMsg = {
      id:          tempId,
      question_id: Number(id),
      sender_id:   user.id,
      message:     messageText,
      file_url:    fileUrl,
      file_name:   fileName,
      file_type:   fileType,
      created_at:  new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimisticMsg]);

    const { error } = await supabase.from('messages').insert({
      question_id: Number(id),
      sender_id:   user.id,
      message:     messageText,
      file_url:    fileUrl,
      file_name:   fileName,
      file_type:   fileType,
    });

    setUploading(false);

    if (error) {
      setUploadError('Failed to send message: ' + error.message);
      setChatMsg(messageText);
      setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  // ─── DERIVED ───────────────────────────────────────────────────────────────

  const acceptedBid = bids.find(b => b.accepted);
  const isPaymentRequired = question?.isPaid && acceptedBid && acceptedBid.bid_price > 0;
  const isPaid = payments && payments.some(p => p.status === 'Completed');

  const isBusy        = uploading || isRecording;
  const canSend       = !isBusy && (chatMsg.trim() || selectedFile || voiceBlob);
  const urgencyColors = { high: "var(--urgent-color)", medium: "var(--accent-warm)", low: "var(--success)" };

  // ─── RENDER ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: 80 }}>
        <h2 style={{ marginTop: 16 }}>Loading question...</h2>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: 80 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, color: "var(--text-muted)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <h2 style={{ marginTop: 16 }}>Question not found</h2>
        <Link to="/browse" className="btn btn-primary" style={{ marginTop: 24 }}>Back to Browse</Link>
      </div>
    );
  }

  return (
    <div className="page">
      {showModal && <GuestModal onClose={() => setShowModal(false)} />}

      {/*  BACK  */}
      <div style={{ background: "white", borderBottom: "1px solid var(--border)", padding: "12px 0" }}>
        <div className="container">
          <Link to="/browse" style={{ color: "var(--text-secondary)", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            ← Back to Browse
          </Link>
        </div>
      </div>

      <div className="container detail-layout">
        {/*  MAIN  */}
        <div className="detail-main">

          {/* QUESTION HEADER */}
          <div className="card detail-header">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="badge badge-subject">{question.subject}</span>
              {question.isPaid ? (
                <span className="badge badge-paid">${question.pricePerHour}/hr</span>
              ) : (
                <span className="badge badge-free">FREE</span>
              )}
              <span className="badge badge-level">{question.level} — {question.grade}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: urgencyColors[question.urgency] }}>
                <span className={`urgency-dot urgency-${question.urgency}`} style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", background: urgencyColors[question.urgency] }} />
                {question.urgency === "high" ? "Urgent" : question.urgency === "medium" ? "Soon" : "Flexible"}
              </span>
            </div>
            <h1 className="detail-title">{question.title}</h1>
            <div className="detail-meta">
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Posted by <strong>{question.studentName}</strong></span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Due {new Date(question.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{question.responses} responses</span>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="card detail-description">
            <h3>Full Question</h3>
            <p style={{ marginTop: 14 }}>{question.description}</p>
            <div className="tags-row" style={{ marginTop: 20 }}>
              {question.tags.map((t) => <span className="tag" key={t}>#{t}</span>)}
            </div>
          </div>

          {/* HELPERS / BIDS */}
          <div className="card helpers-section">
            <div className="helpers-title">
              {question.isPaid ? "Tutor Bids" : "Volunteers"} ({bids.length})
              {!user && <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 400 }}> — Sign up to accept a helper</span>}
            </div>

            {loadingBids ? (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>Loading bids...</div>
            ) : bids.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontStyle: "italic" }}>No offers yet.</div>
            ) : bids.map((bid, i) => {
              const isAccepted = bid.accepted;
              return (
                <div key={bid.id || i} className="helper-card" style={isAccepted ? { borderColor: "var(--success)", background: "var(--success-light)" } : {}}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                    {(bid.tutor_name || "Tutor").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="helper-info">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="helper-name">{bid.tutor_name}</span>
                      <span className="badge badge-peer" style={{ fontSize: 11 }}>Peer</span>
                    </div>
                    <div className="helper-bid">
                      {bid.bid_price === 0 ? (
                        <span style={{ color: "var(--free-color)", fontWeight: 700 }}>Offering free help</span>
                      ) : (
                        <span style={{ color: "var(--primary)", fontWeight: 700 }}>${bid.bid_price}/hr</span>
                      )}
                    </div>
                    <p className="helper-message">"{bid.message}"</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    {isAccepted ? (
                      <>
                        <span className="badge badge-free" style={{ padding: "8px 14px", background: "var(--success-light)", color: "var(--success)" }}>Accepted</span>
                        {user?.id === question.user_id && isPaymentRequired && !isPaid && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setPaymentError("");
                              setPaymentSuccess(false);
                              setPaymentStep("SELECT");
                              setPaymentPhone("");
                              setPaymentPin("");
                              setCardName("");
                              setCardNumber("");
                              setCardExpiry("");
                              setCardCvv("");
                              setOtpCode("");
                              setSimulatedOutcome(null);
                              setSimulatedTxDetails(null);
                              setShowPaymentModal(true);
                            }}
                          >
                            Pay Now
                          </button>
                        )}
                      </>
                    ) : (
                      user?.id === question.user_id && (
                        <button className="btn btn-sm btn-success" onClick={() => handleAccept(bid.id)}>Accept</button>
                      )
                    )}
                  </div>
                </div>
              );
            })}

            {user?.role === "tutor" && !accepted && (
              showBidForm ? (
                <div style={{ marginTop: 20, padding: 24, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "white" }}>
                  <h4 style={{ marginBottom: 16, fontSize: 15 }}>Submit your offer</h4>
                  <textarea
                    style={{ width: "100%", padding: 12, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", minHeight: 80, marginBottom: 12, resize: "vertical" }}
                    placeholder="Message to student..."
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                  />
                  {question.isPaid && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <label style={{ fontSize: 14, fontWeight: 600 }}>Hourly Rate ($)</label>
                      <input
                        type="number"
                        style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", width: 100 }}
                        value={bidPrice}
                        onChange={(e) => setBidPrice(e.target.value)}
                      />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-sm btn-primary" onClick={submitBid} disabled={submittingBid}>
                      {submittingBid ? "Submitting..." : "Submit Bid"}
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setShowBidForm(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  style={{ marginTop: 20, padding: "20px 24px", border: "2px dashed var(--primary)", borderRadius: "var(--radius-sm)", textAlign: "center", cursor: "pointer", color: "var(--primary)", fontWeight: 600, fontSize: 14, transition: "background 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--primary-light)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  onClick={() => setShowBidForm(true)}
                >
                  + Offer to help {question.isPaid ? `at your rate` : "for free"}
                </div>
              )
            )}
          </div>

          {/* ═══════════════════════════════ CHAT ═══════════════════════════════ */}
          <div className="card chat-thread">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Discussion Thread</h3>

            {/* ── Message list ── */}
            {chatLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                Loading messages…
              </div>
            ) : chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14 }}>
                No messages yet — be the first to start the discussion!
              </div>
            ) : (
              chatMessages.map((msg, i) => {
                const isMine = user && msg.sender_id === user.id;
                const formattedTime = msg.created_at
                  ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';
                return (
                  <div key={msg.id ?? i}>
                    <div className={`chat-bubble ${isMine ? 'student' : 'tutor'}`}>
                      {msg.message && <div className="chat-text">{msg.message}</div>}
                      {msg.file_url && (
                        <FileAttachment
                          fileUrl={msg.file_url}
                          fileName={msg.file_name}
                          fileType={msg.file_type}
                          isMine={isMine}
                        />
                      )}
                      <div className="chat-meta">{formattedTime}</div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Invisible scroll anchor */}
            <div ref={chatBottomRef} />

            {/* ── File preview chip ── */}
            {selectedFile && (
              <div className="chat-file-preview">
                <span className="chat-file-preview-icon">
                  {selectedFile.type.startsWith('image/') ? '🖼️' : '📄'}
                </span>
                <span className="chat-file-preview-name">{selectedFile.name}</span>
                <button className="chat-file-preview-remove" onClick={clearFile} title="Remove file" disabled={uploading}>✕</button>
              </div>
            )}

            {/* ── Voice preview chip (recorded, ready to send) ── */}
            {voiceBlob && !isRecording && (
              <div className="chat-voice-preview">
                <span className="chat-voice-preview-icon">🎙️</span>
                <span className="chat-voice-preview-label">Voice message ready · {formatDuration(recordSeconds)}</span>
                <audio controls src={URL.createObjectURL(voiceBlob)} className="chat-voice-preview-player" />
                <button className="chat-file-preview-remove" onClick={discardVoice} title="Discard voice message" disabled={uploading}>✕</button>
              </div>
            )}

            {/* ── Recording indicator ── */}
            {isRecording && (
              <div className="chat-recording-bar">
                <span className="chat-rec-dot" />
                <span className="chat-rec-label">Recording… {formatDuration(recordSeconds)}</span>
                <button className="chat-rec-stop" onClick={stopRecording} title="Stop recording">⏹ Stop</button>
                <button className="chat-rec-cancel" onClick={cancelRecording} title="Cancel recording">✕</button>
              </div>
            )}

            {/* ── Upload progress ── */}
            {uploading && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="chat-upload-progress">
                <div className="chat-upload-bar" style={{ width: `${uploadProgress}%` }} />
                <span className="chat-upload-label">Uploading… {uploadProgress}%</span>
              </div>
            )}

            {/* ── Error (upload / mic) ── */}
            {(uploadError || micError) && (
              <div className="chat-upload-error">{uploadError || micError}</div>
            )}

            {/* ── Input row ── */}
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/zip"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              disabled={!user || isBusy}
            />

            {paymentSuccess && (
              <div style={{
                background: "#e8f5e9",
                color: "#2e7d32",
                padding: "12px 16px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid #a5d6a7",
                marginBottom: 16,
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span>✓ Payment successfully processed! The tutoring session is now active.</span>
                <button 
                  style={{ background: "none", border: "none", color: "#2e7d32", cursor: "pointer", fontWeight: 700 }}
                  onClick={() => setPaymentSuccess(false)}
                >
                  ✕
                </button>
              </div>
            )}

            {isPaymentRequired && !isPaid ? (
              <div className="chat-payment-lock-banner" style={{
                padding: "20px",
                background: "linear-gradient(135deg, var(--primary-light), #f0ebff)",
                border: "1px solid var(--primary)",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
                margin: "16px 0",
                boxShadow: "var(--shadow-sm)"
              }}>
                <span style={{ fontSize: 24, display: "block", marginBottom: 8 }}>🔒</span>
                {user?.id === question.user_id ? (
                  <>
                    <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)", fontSize: 16 }}>Payment Required</h4>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
                      Please pay the agreed rate of <strong>${acceptedBid?.bid_price}/hr</strong> to activate this discussion session and allow the tutor to start working.
                    </p>
                    <button
                      className="btn btn-primary"
                      style={{ margin: "0 auto" }}
                      onClick={() => {
                        setPaymentError("");
                        setPaymentSuccess(false);
                        setShowPaymentModal(true);
                      }}
                    >
                      Pay Now (${acceptedBid?.bid_price})
                    </button>
                  </>
                ) : user?.id === acceptedBid?.tutor_id ? (
                  <>
                    <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)", fontSize: 16 }}>Awaiting Payment</h4>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                      Waiting for the student to complete payment. You will be able to start chatting and submit your work as soon as the transaction is completed.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 style={{ margin: "0 0 8px 0", color: "var(--text-secondary)", fontSize: 16 }}>Session Locked</h4>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                      This tutoring discussion is locked pending payment by the student.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="chat-input-row">
                {/* Attachment button */}
                <button
                  className="chat-attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!user || isBusy || !!voiceBlob}
                  title="Attach file or image"
                  type="button"
                >
                  📎
                </button>

                {/* Text input */}
                <input
                  type="text"
                  placeholder={user ? (isRecording ? "Recording in progress…" : "Type a reply…") : "Sign in to join the discussion"}
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isRecording && sendChat()}
                  disabled={!user || isBusy}
                />

                {/* Mic button — only shown when NOT recording and no voice blob pending */}
                {user && !isRecording && !voiceBlob && (
                  <button
                    className="chat-mic-btn"
                    onClick={startRecording}
                    disabled={isBusy || !micSupported}
                    title={micSupported ? "Record voice message" : "Voice recording not supported in this browser"}
                    type="button"
                  >
                    🎙️
                  </button>
                )}

                {/* Send button — hidden while recording */}
                {!isRecording && (
                  <button
                    onClick={sendChat}
                    disabled={!canSend}
                    type="button"
                  >
                    {uploading ? '…' : 'Send →'}
                  </button>
                )}
              </div>
            )}

            {!user && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
                <button
                  onClick={() => setShowModal(true)}
                  style={{ background: "none", border: "none", color: "var(--primary)", textDecoration: "underline", cursor: "pointer", fontSize: 12 }}
                >
                  Sign up
                </button>
                {" "}to post in this thread
              </p>
            )}
          </div>
        </div>

        {/*  SIDEBAR  */}
        <div className="detail-sidebar">
          {/* QUESTION INFO */}
          <div className="card sidebar-card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quick Info</h3>
            {[
              ["Subject",   question.subject],
              ["Level",     question.grade],
              ["Deadline",  new Date(question.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })],
              ["Help Type", question.isPaid ? `Paid — $${question.pricePerHour}/hr` : "Free"],
              ["Responses", question.responses],
              ["Status",    question.status.charAt(0).toUpperCase() + question.status.slice(1)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* STUDENT PROFILE */}
          <div className="card sidebar-card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Asked by</h3>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, margin: "0 auto 10px" }}>
                {question.studentName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div style={{ fontWeight: 700 }}>{question.studentName}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{question.grade}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>3 questions posted</div>
            </div>
          </div>

          {/* OFFER TO HELP */}
          {!user && (
            <div className="card sidebar-card" style={{ background: "var(--primary)", color: "white" }}>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Can you help?</h3>
                <p style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                  Sign up to offer your expertise and earn money (or give back for free).
                </p>
                <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => setShowModal(true)}>
                  Sign Up to Help →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── PAYMENT OPTIONS MODAL ─── */}
      {showPaymentModal && acceptedBid && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(8px)"
        }}>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes scaleIn {
              0% { transform: scale(0.9); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes drawCheck {
              to { stroke-dashoffset: 0; }
            }
            .payment-modal-card {
              animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              background: white;
              border-radius: 16px;
              width: 90%;
              max-width: 440px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
              border: 1px solid rgba(226, 232, 240, 0.8);
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }
            .payment-step-indicator {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0 16px;
              margin-bottom: 24px;
            }
            .step-dot {
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 700;
              transition: all 0.3s;
            }
            .step-dot.active {
              background: var(--primary);
              color: white;
              box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
            }
            .step-dot.pending {
              background: #f1f5f9;
              color: #94a3b8;
              border: 1px solid #e2e8f0;
            }
            .step-line {
              flex: 1;
              height: 2px;
              background: #e2e8f0;
              margin: 0 8px;
            }
            .step-line.active {
              background: var(--primary);
            }
            .payment-input-group {
              margin-bottom: 16px;
            }
            .payment-input-group label {
              display: block;
              font-size: 13px;
              font-weight: 600;
              color: #334155;
              margin-bottom: 6px;
            }
            .payment-input-field {
              width: 100%;
              padding: 10px 14px;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              font-size: 14px;
              color: #1e293b;
              box-sizing: border-box;
              transition: border-color 0.2s, box-shadow 0.2s;
            }
            .payment-input-field:focus {
              outline: none;
              border-color: var(--primary);
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px dashed #f1f5f9;
              font-size: 13.5px;
            }
            .receipt-row:last-child {
              border-bottom: none;
            }
          `}</style>

          <div className="payment-modal-card">
            {/* Top Security Banner */}
            <div style={{
              background: "#f8fafc",
              padding: "12px 20px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#475569" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>Secure Payment Gateway</span>
              </div>
              {!initiatingPayment && paymentStep !== "RESULT" && (
                <button 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentError("");
                  }} 
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>

            {/* Merchant / Product Info */}
            <div style={{ padding: "20px 24px 12px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>PAYMENT TO JONNE TUTOR</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                {paymentMethod === "MTN" ? "UGX " : "$"}
                {paymentMethod === "MTN" 
                  ? (acceptedBid.bid_price * 3700).toLocaleString() 
                  : Number(acceptedBid.bid_price).toFixed(2)
                }
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 6, fontWeight: 500 }}>
                For helper: <strong>{acceptedBid.tutor_name}</strong>
              </div>
            </div>

            {/* Step Indicators */}
            {paymentStep !== "RESULT" && paymentStep !== "PROCESSING" && (
              <div style={{ padding: "20px 24px 0" }}>
                <div className="payment-step-indicator">
                  <div className={`step-dot active`}>1</div>
                  <div className={`step-line ${paymentStep !== "SELECT" ? "active" : ""}`} />
                  <div className={`step-dot ${paymentStep !== "SELECT" ? "active" : "pending"}`}>2</div>
                  <div className={`step-line ${paymentStep === "VERIFY" ? "active" : ""}`} />
                  <div className={`step-dot ${paymentStep === "VERIFY" ? "active" : "pending"}`}>3</div>
                </div>
              </div>
            )}

            {/* Content Body */}
            <div style={{ padding: "12px 24px 24px" }}>
              
              {/* STEP 1: SELECT METHOD */}
              {paymentStep === "SELECT" && (
                <div>
                  <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Select payment method</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                    <div 
                      onClick={() => setPaymentMethod("CARD")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 16,
                        border: `2px solid ${paymentMethod === 'CARD' ? 'var(--primary)' : '#e2e8f0'}`,
                        borderRadius: 12,
                        cursor: "pointer",
                        background: paymentMethod === 'CARD' ? 'var(--primary-light)' : 'transparent',
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === 'CARD' ? 'var(--primary)' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: paymentMethod === 'CARD' ? 'var(--primary)' : '#1e293b' }}>Visa / Mastercard</div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Pay with Credit or Debit card</div>
                        </div>
                      </div>
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: `2px solid ${paymentMethod === 'CARD' ? 'var(--primary)' : '#cbd5e1'}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {paymentMethod === 'CARD' && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--primary)" }} />}
                      </div>
                    </div>

                    <div 
                      onClick={() => setPaymentMethod("MTN")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 16,
                        border: `2px solid ${paymentMethod === 'MTN' ? 'var(--primary)' : '#e2e8f0'}`,
                        borderRadius: 12,
                        cursor: "pointer",
                        background: paymentMethod === 'MTN' ? 'var(--primary-light)' : 'transparent',
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: "#F2C94C",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 900,
                          color: "black"
                        }}>MTN</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: paymentMethod === 'MTN' ? 'var(--primary)' : '#1e293b' }}>MTN Mobile Money</div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Pay using MTN Wallet (Uganda)</div>
                        </div>
                      </div>
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: `2px solid ${paymentMethod === 'MTN' ? 'var(--primary)' : '#cbd5e1'}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {paymentMethod === 'MTN' && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--primary)" }} />}
                      </div>
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ width: "100%", justifyContent: "center", padding: "12px 0", borderRadius: 10 }}
                    onClick={() => setPaymentStep("DETAILS")}
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* STEP 2: DETAILS */}
              {paymentStep === "DETAILS" && (
                <form onSubmit={handleDetailsSubmit}>
                  <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Enter payment details</h4>
                  
                  {paymentError && (
                    <div style={{
                      color: "#c62828",
                      fontSize: 13,
                      marginBottom: 16,
                      padding: "10px 14px",
                      background: "#ffebee",
                      border: "1px solid #ef9a9a",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {paymentMethod === "CARD" ? (
                    <div>
                      <div className="payment-input-group">
                        <label>Cardholder Name</label>
                        <input 
                          type="text" 
                          className="payment-input-field" 
                          placeholder="e.g. John Doe"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                        />
                      </div>
                      <div className="payment-input-group">
                        <label>Card Number</label>
                        <div style={{ position: "relative" }}>
                          <input 
                            type="text" 
                            className="payment-input-field" 
                            placeholder="4111 2222 3333 4444"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            style={{ paddingRight: 40 }}
                          />
                          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div className="payment-input-group" style={{ flex: 1 }}>
                          <label>Expiry Date</label>
                          <input 
                            type="text" 
                            className="payment-input-field" 
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={handleCardExpiryChange}
                          />
                        </div>
                        <div className="payment-input-group" style={{ flex: 1 }}>
                          <label>CVV</label>
                          <input 
                            type="password" 
                            className="payment-input-field" 
                            placeholder="123"
                            value={cardCvv}
                            onChange={handleCardCvvChange}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="payment-input-group">
                        <label>MTN Phone Number</label>
                        <div style={{ position: "relative" }}>
                          <input 
                            type="text" 
                            className="payment-input-field" 
                            placeholder="0771 234 567"
                            value={paymentPhone}
                            onChange={handlePhoneChange}
                            style={{ paddingLeft: 60 }}
                          />
                          <div style={{
                            position: "absolute",
                            left: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#64748b"
                          }}>+256</div>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                          Enter your active mobile money phone number to receive authorization prompt.
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                    <button 
                      type="button"
                      className="btn btn-secondary" 
                      style={{ flex: 1, justifyContent: "center", borderRadius: 10 }}
                      onClick={() => setPaymentStep("SELECT")}
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      className="btn btn-primary" 
                      style={{ flex: 2, justifyContent: "center", borderRadius: 10 }}
                    >
                      Pay Now
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: PROCESSING */}
              {paymentStep === "PROCESSING" && (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{
                    width: 60,
                    height: 60,
                    border: "4px solid rgba(99, 102, 241, 0.15)",
                    borderTop: "4px solid var(--primary)",
                    borderRadius: "50%",
                    margin: "0 auto 24px",
                    animation: "spin 1s linear infinite"
                  }} />
                  <h4 className="pulse-indicator" style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>
                    {processingMessage}
                  </h4>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                    Please do not close this modal or refresh the page.
                  </p>
                </div>
              )}

              {/* STEP 4: VERIFY */}
              {paymentStep === "VERIFY" && (
                <form onSubmit={handleVerifySubmit}>
                  <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                    {paymentMethod === "CARD" ? "3D Secure Authentication" : "Mobile Wallet PIN Prompt"}
                  </h4>
                  
                  {paymentError && (
                    <div style={{
                      color: "#c62828",
                      fontSize: 13,
                      marginBottom: 16,
                      padding: "10px 14px",
                      background: "#ffebee",
                      border: "1px solid #ef9a9a",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {paymentMethod === "CARD" ? (
                    <div>
                      <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.5, marginBottom: 16 }}>
                        We have sent a verification code to the mobile number registered with your card. Enter the 6-digit OTP code below to authorize this transaction.
                      </p>
                      <div className="payment-input-group">
                        <label>One-Time Password (OTP)</label>
                        <input 
                          type="text" 
                          className="payment-input-field" 
                          placeholder="e.g. 123456"
                          value={otpCode}
                          onChange={handleOtpChange}
                          style={{ textAlign: "center", letterSpacing: "4px", fontSize: 18, fontWeight: 700 }}
                          maxLength={6}
                        />
                      </div>
                      <div style={{ textAlign: "center", marginBottom: 16 }}>
                        <span 
                          style={{ fontSize: 12, color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}
                          onClick={(e) => {
                            e.preventDefault();
                            alert("OTP Resent!");
                          }}
                        >
                          Resend Code
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.5, marginBottom: 16 }}>
                        A push request has been sent to <strong>+256 {paymentPhone}</strong>. Please confirm the request on your phone by entering your PIN, or input your 4-digit PIN below to settle the charge directly.
                      </p>
                      <div className="payment-input-group">
                        <label>4-Digit MoMo PIN</label>
                        <input 
                          type="password" 
                          className="payment-input-field" 
                          placeholder="••••"
                          value={paymentPin}
                          onChange={handlePinChange}
                          style={{ textAlign: "center", letterSpacing: "8px", fontSize: 20 }}
                          maxLength={4}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                    <button 
                      type="button"
                      className="btn btn-secondary" 
                      style={{ flex: 1, justifyContent: "center", borderRadius: 10 }}
                      onClick={() => {
                        setSimulatedOutcome("CANCELLED");
                        const amountStr = paymentMethod === 'MTN' 
                          ? `UGX ${(acceptedBid.bid_price * 3700).toLocaleString()}` 
                          : `USD ${Number(acceptedBid.bid_price).toFixed(2)}`;
                        const dateStr = new Date().toLocaleString("en-GB", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        });
                        setSimulatedTxDetails({
                          txRef: `TXN-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`,
                          amount: amountStr,
                          method: paymentMethod === 'MTN' ? 'MTN Mobile Money' : 'Visa/Mastercard',
                          date: dateStr,
                          status: "Cancelled"
                        });
                        setPaymentStep("RESULT");
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="btn btn-primary" 
                      style={{ flex: 2, justifyContent: "center", borderRadius: 10 }}
                    >
                      Verify & Pay
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 5: RESULT */}
              {paymentStep === "RESULT" && simulatedOutcome && simulatedTxDetails && (
                <div style={{ textAlign: "center" }}>
                  
                  {simulatedOutcome === "SUCCESS" ? (
                    <div>
                      <svg className="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style={{ width: 64, height: 64, color: "#2e7d32", display: "block", margin: "0 auto 16px" }}>
                        <circle cx="26" cy="26" r="25" fill="none" stroke="currentColor" strokeWidth="3" style={{ strokeDasharray: 157, strokeDashoffset: 157, animation: "drawCheck 0.5s ease-in-out 0.1s forwards" }}/>
                        <path fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 27l8 8 16-16" style={{ strokeDasharray: 48, strokeDashoffset: 48, animation: "drawCheck 0.3s ease-in-out 0.6s forwards" }}/>
                      </svg>
                      <h4 style={{ fontSize: 18, fontWeight: 800, color: "#2e7d32", margin: "0 0 6px" }}>Payment Successful</h4>
                      <p style={{ fontSize: 13.5, color: "#475569", margin: "0 0 20px", lineHeight: 1.4 }}>
                        Your payment has been successfully completed. The question status has been updated.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <svg className="error-crossmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style={{ width: 64, height: 64, color: "#d32f2f", display: "block", margin: "0 auto 16px" }}>
                        <circle cx="26" cy="26" r="25" fill="none" stroke="currentColor" strokeWidth="3" style={{ strokeDasharray: 157, strokeDashoffset: 157, animation: "drawCheck 0.5s ease-in-out 0.1s forwards" }}/>
                        <path fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" d="M16 16l20 20M36 16L16 36" style={{ strokeDasharray: 48, strokeDashoffset: 48, animation: "drawCheck 0.3s ease-in-out 0.6s forwards" }}/>
                      </svg>
                      
                      <h4 style={{ 
                        fontSize: 18, 
                        fontWeight: 800, 
                        color: simulatedOutcome === "CANCELLED" ? "#616161" : simulatedOutcome === "INSUFFICIENT_BALANCE" ? "#ef6c00" : "#d32f2f", 
                        margin: "0 0 6px" 
                      }}>
                        {simulatedOutcome === "FAILED" && "Payment Failed"}
                        {simulatedOutcome === "CANCELLED" && "Payment Cancelled"}
                        {simulatedOutcome === "INSUFFICIENT_BALANCE" && "Insufficient Funds"}
                        {simulatedOutcome === "INVALID_CARD" && "Invalid Card Details"}
                        {simulatedOutcome === "PIN_INCORRECT" && "Incorrect Mobile PIN"}
                        {simulatedOutcome === "TIMEOUT" && "Gateway Timeout"}
                        {simulatedOutcome === "DECLINED" && "Transaction Declined"}
                      </h4>
                      
                      <p style={{ fontSize: 13.5, color: "#475569", margin: "0 0 20px", lineHeight: 1.4 }}>
                        {simulatedOutcome === "FAILED" && "The payment transaction could not be completed. Please try again."}
                        {simulatedOutcome === "CANCELLED" && "The transaction was cancelled. No charges were made."}
                        {simulatedOutcome === "INSUFFICIENT_BALANCE" && "You do not have enough funds in your account to complete this transaction."}
                        {simulatedOutcome === "INVALID_CARD" && "The card details provided were rejected by the issuing bank. Please verify and retry."}
                        {simulatedOutcome === "PIN_INCORRECT" && "The Mobile Money PIN you entered is incorrect. Please authorize again."}
                        {simulatedOutcome === "TIMEOUT" && "We were unable to reach the payment provider's network in time. Please retry."}
                        {simulatedOutcome === "DECLINED" && "This transaction was declined by your bank/payment provider. Please contact your bank."}
                      </p>
                    </div>
                  )}

                  {/* Receipt Box */}
                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 16,
                    textAlign: "left",
                    marginBottom: 24
                  }}>
                    <div className="receipt-row">
                      <span style={{ color: "#64748b", fontWeight: 500 }}>Transaction Ref</span>
                      <span style={{ fontWeight: 600, color: "#1e293b", fontFamily: "monospace" }}>{simulatedTxDetails.txRef}</span>
                    </div>
                    <div className="receipt-row">
                      <span style={{ color: "#64748b", fontWeight: 500 }}>Payment Method</span>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{simulatedTxDetails.method}</span>
                    </div>
                    <div className="receipt-row">
                      <span style={{ color: "#64748b", fontWeight: 500 }}>Amount</span>
                      <span style={{ fontWeight: 700, color: "#1e293b" }}>{simulatedTxDetails.amount}</span>
                    </div>
                    <div className="receipt-row">
                      <span style={{ color: "#64748b", fontWeight: 500 }}>Date & Time</span>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{simulatedTxDetails.date}</span>
                    </div>
                    <div className="receipt-row">
                      <span style={{ color: "#64748b", fontWeight: 500 }}>Status</span>
                      <span style={{ 
                        fontWeight: 700, 
                        color: simulatedOutcome === "SUCCESS" ? "#2e7d32" : simulatedOutcome === "CANCELLED" ? "#616161" : "#d32f2f" 
                      }}>
                        {simulatedTxDetails.status}
                      </span>
                    </div>
                  </div>

                  {/* Buttons */}
                  {simulatedOutcome === "SUCCESS" ? (
                    <button 
                      className="btn btn-primary"
                      style={{ width: "100%", justifyContent: "center", padding: "12px 0", borderRadius: 10 }}
                      onClick={() => {
                        setShowPaymentModal(false);
                        setPaymentError("");
                      }}
                    >
                      Return to Question
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button 
                          className="btn btn-secondary"
                          style={{ flex: 1, justifyContent: "center", borderRadius: 10 }}
                          onClick={() => {
                            setPaymentStep("SELECT");
                            setPaymentError("");
                            setSimulatedOutcome(null);
                            setSimulatedTxDetails(null);
                          }}
                        >
                          Change Method
                        </button>
                        <button 
                          className="btn btn-primary"
                          style={{ flex: 1.5, justifyContent: "center", borderRadius: 10 }}
                          onClick={() => {
                            setPaymentStep("DETAILS");
                            setPaymentError("");
                            setSimulatedOutcome(null);
                            setSimulatedTxDetails(null);
                          }}
                        >
                          Retry Payment
                        </button>
                      </div>
                      <button 
                        className="btn btn-ghost"
                        style={{ width: "100%", justifyContent: "center", color: "#64748b" }}
                        onClick={() => {
                          setShowPaymentModal(false);
                          setPaymentError("");
                        }}
                      >
                        Cancel & Close
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
