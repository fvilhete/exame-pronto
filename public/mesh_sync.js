/**
 * ExamePronto - Motor de Sincronização Mesh P2P Offline
 * Pilar 5: Conectividade Local Browser-to-Browser sem Consumo de Dados Móveis
 * 
 * Permite a estudantes em distritos com fraca cobertura (Niassa, Tete, Cabo Delgado)
 * partilhar exames, questões e rankings locais via WebRTC DataChannel ou Pacotes Compactos.
 * 
 * Vilhete Solutions - Moçambique
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MeshSync = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY_OFFLINE_BANK = 'examepronto_mesh_bank';
  let peerConnection = null;
  let dataChannel = null;

  /**
   * Exporta o acervo de exames e questões guardados localmente para um pacote partilhável
   */
  function exportLocalBundle() {
    try {
      const cachedProgress = localStorage.getItem('examepronto_progress') || '[]';
      const userProfile = localStorage.getItem('examepronto_profile') || '{}';
      const favoriteExams = localStorage.getItem('examepronto_favorites') || '[]';

      const bundle = {
        app: 'ExamePronto',
        version: '9.0',
        exportedAt: new Date().toISOString(),
        provincesCovered: 11,
        progress: JSON.parse(cachedProgress),
        favorites: JSON.parse(favoriteExams),
        timestamp: Date.now()
      };

      const jsonStr = JSON.stringify(bundle);
      return {
        success: true,
        bundleSizeKB: Math.round(jsonStr.length / 1024),
        bundleData: jsonStr
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Importa e funde um pacote recebido de um colega no armazenamento local
   */
  function importBundle(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || data.app !== 'ExamePronto') {
        throw new Error('Ficheiro de dados inválido ou corrompido.');
      }

      // Fundir favoritos e dados offline
      const currentFavs = JSON.parse(localStorage.getItem('examepronto_favorites') || '[]');
      const newFavs = Array.from(new Set([...currentFavs, ...(data.favorites || [])]));
      localStorage.setItem('examepronto_favorites', JSON.stringify(newFavs));

      localStorage.setItem(STORAGE_KEY_OFFLINE_BANK, JSON.stringify({
        lastSync: new Date().toISOString(),
        origin: 'P2P_MESH_TRANSFER',
        itemsCount: (data.favorites || []).length
      }));

      return {
        success: true,
        importedAt: new Date().toISOString(),
        itemsImported: newFavs.length,
        message: 'Pacote de exames sincronizado com sucesso via Rede Mesh Offline!'
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Inicia o nó transmissor WebRTC para envio direto browser-to-browser
   */
  async function createP2POffer(onSignalReady) {
    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    peerConnection = new RTCPeerConnection(config);

    dataChannel = peerConnection.createDataChannel('examepronto_mesh');
    dataChannel.onopen = () => console.log('✅ [Mesh P2P] Canal de dados local aberto com sucesso.');
    dataChannel.onmessage = (e) => {
      console.log('📦 [Mesh P2P] Dados recebidos do parceiro:', e.data);
      importBundle(e.data);
    };

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate && peerConnection.localDescription) {
        if (onSignalReady) {
          onSignalReady(JSON.stringify(peerConnection.localDescription));
        }
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return peerConnection;
  }

  /**
   * Envia os dados do acervo pelo canal WebRTC P2P aberto
   */
  function sendBundleOverP2P() {
    if (!dataChannel || dataChannel.readyState !== 'open') {
      throw new Error('Canal P2P não conectado.');
    }
    const bundle = exportLocalBundle();
    if (bundle.success) {
      dataChannel.send(bundle.bundleData);
      return { success: true, sentBytes: bundle.bundleData.length };
    }
    throw new Error(bundle.error);
  }

  return {
    exportLocalBundle,
    importBundle,
    createP2POffer,
    sendBundleOverP2P
  };
}));
