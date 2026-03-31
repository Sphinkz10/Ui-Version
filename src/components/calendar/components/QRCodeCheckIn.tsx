/**
 * QR CODE CHECK-IN COMPONENT
 * Generate QR codes for event check-in
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { QrCode, Download, Copy, Check, X, Smartphone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface QRCodeCheckInProps {
  eventId: string;
  eventTitle: string;
  participantId?: string; // If specific to one participant
  expiresIn?: number; // Minutes until expiration
}

export function QRCodeCheckIn({ 
  eventId, 
  eventTitle, 
  participantId,
  expiresIn = 60,
}: QRCodeCheckInProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  useEffect(() => {
    generateQRCode();
  }, [eventId, participantId]);

  const generateQRCode = () => {
    // Generate check-in URL
    const baseUrl = window.location.origin;
    const checkInToken = generateToken();
    const checkInUrl = participantId
      ? `${baseUrl}/check-in/${eventId}/${participantId}?token=${checkInToken}`
      : `${baseUrl}/check-in/${eventId}?token=${checkInToken}`;

    // Generate QR code using API
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkInUrl)}`;
    setQrCodeUrl(qrApiUrl);

    // Set expiration
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + expiresIn);
    setExpiresAt(expires);
  };

  const generateToken = () => {
    return crypto.randomUUID();
  };

  const handleCopyUrl = () => {
    const checkInUrl = qrCodeUrl.split('data=')[1];
    if (checkInUrl) {
      navigator.clipboard.writeText(decodeURIComponent(checkInUrl));
      setCopied(true);
      toast.success('Link copiado para clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-code-${eventId}${participantId ? `-${participantId}` : ''}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code descarregado!');
  };

  const handleRefresh = () => {
    generateQRCode();
    toast.success('QR Code renovado!');
  };

  const getTimeRemaining = () => {
    if (!expiresAt) return '';
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    return minutes > 0 ? `${minutes}min` : 'Expirado';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
            <QrCode className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">QR Code Check-In</h3>
            <p className="text-xs text-slate-600">
              {participantId ? 'Check-in individual' : 'Check-in para todos'}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-slate-600" />
        </motion.button>
      </div>

      {/* QR Code Display */}
      <div className="relative rounded-xl border-2 border-slate-200 bg-white p-6">
        <div className="flex flex-col items-center">
          {/* QR Code Image */}
          <div className="relative">
            <img
              src={qrCodeUrl}
              alt={`QR Code para ${eventTitle}`}
              className="w-64 h-64 rounded-lg border-4 border-slate-100"
            />
            
            {/* Expiration Badge */}
            {expiresAt && (
              <div className="absolute -top-2 -right-2">
                <div className="px-3 py-1 rounded-full bg-amber-100 border-2 border-amber-300 text-xs font-bold text-amber-700">
                  {getTimeRemaining()}
                </div>
              </div>
            )}
          </div>

          {/* Event Title */}
          <p className="text-sm font-semibold text-slate-900 mt-4 text-center">
            {eventTitle}
          </p>
          <p className="text-xs text-slate-600">
            Aponte a câmara para fazer check-in
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCopyUrl}
          className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border-2 border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50 transition-all"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copiar Link
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white hover:from-violet-400 hover:to-violet-500 transition-all"
        >
          <Download className="h-4 w-4" />
          Descarregar
        </motion.button>
      </div>

      {/* Instructions */}
      <div className="rounded-xl bg-sky-50 border border-sky-200 p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-4 w-4 text-white" />
          </div>
          <div>
            <h5 className="font-semibold text-sky-900 mb-1">
              Como usar
            </h5>
            <ul className="text-sm text-sky-700 space-y-1">
              <li>1. Partilhe este QR Code com os atletas</li>
              <li>2. Atletas escaneiam com a câmara do telemóvel</li>
              <li>3. Check-in é registado automaticamente</li>
              <li>4. {participantId ? 'QR Code individual por segurança' : 'QR Code geral para todos os participantes'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Expiration Warning */}
      {expiresAt && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <div className="flex items-center gap-2 text-sm">
            <QrCode className="h-4 w-4 text-amber-600" />
            <p className="text-amber-700">
              Este QR Code expira em <strong>{getTimeRemaining()}</strong>. 
              Clique em renovar para gerar um novo código.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal wrapper for QR Code
interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  participantId?: string;
}

export function QRCodeModal({ isOpen, onClose, eventId, eventTitle, participantId }: QRCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">QR Code Check-In</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-slate-600" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-6">
          <QRCodeCheckIn
            eventId={eventId}
            eventTitle={eventTitle}
            participantId={participantId}
          />
        </div>
      </motion.div>
    </div>
  );
}
