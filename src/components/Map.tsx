import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Search, Navigation, Layers, MapPin, Trash2, Settings, Plus, X, Store, Pencil, ShieldCheck, Image as ImageIcon, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { db, auth } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const initialLocations = [
  { 
    id: 1, 
    name: 'Marco Zero do Equador', 
    position: [0.0011, -51.0783], 
    type: 'Landmark',
    description: 'Monumento que marca a passagem da linha imaginária do Equador em Macapá.',
    logoUrl: 'https://picsum.photos/seed/marcozero/200/200',
    isAccredited: false
  },
  { 
    id: 2, 
    name: 'Fortaleza de São José', 
    position: [0.0349, -51.0482], 
    type: 'Historical',
    description: 'Uma das maiores fortificações construídas pelos portugueses na América do Sul.',
    logoUrl: 'https://picsum.photos/seed/fortaleza/200/200',
    isAccredited: false
  },
  { 
    id: 3, 
    name: 'Trapiche Eliezer Levy', 
    position: [0.0381, -51.0455], 
    type: 'Attraction',
    description: 'Ponto turístico clássico na orla de Macapá, avançando sobre o Rio Amazonas.',
    logoUrl: 'https://picsum.photos/seed/trapiche/200/200',
    isAccredited: false
  },
  { 
    id: 4, 
    name: 'Complexo Turístico Rampa do Açaí', 
    position: [0.0155, -51.056833], 
    type: 'Cultural',
    description: 'Local tradicional de desembarque e comercialização de açaí na capital amapaense.',
    logoUrl: 'https://picsum.photos/seed/rampa/200/200',
    isAccredited: true
  },
];

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function MapEvents({ onMapClick }: { onMapClick: () => void }) {
  const map = useMap();
  useEffect(() => {
    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapClick]);
  return null;
}

const createCustomIcon = (type: string) => {
  if (type === 'Batedeira credenciada da rede açaí') {
    const iconHtml = renderToStaticMarkup(
      <div className="relative flex items-center justify-center w-10 h-10 bg-purple-700 rounded-full border-2 border-white shadow-xl text-white">
        <Store size={20} />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-400 rounded-full border-2 border-white flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-purple-900 rounded-full" />
        </div>
      </div>
    );
    return L.divIcon({
      html: iconHtml,
      className: 'custom-marker-container',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  }
  return new L.Icon.Default();
};

export default function Map() {
  const [center, setCenter] = useState<[number, number]>([0.0349, -51.0664]);
  const [zoom, setZoom] = useState(13);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const isUserAdmin = useMemo(() => {
    return user?.email === 'tiagofernandesdealmeida.tfa@gmail.com';
  }, [user]);

  const [formData, setFormData] = useState({ 
    name: '', 
    type: 'Point of Interest', 
    lat: '', 
    lng: '',
    description: '',
    address: '',
    whatsapp: '',
    logoUrl: '',
    isAccredited: false
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Real-time Listener
  useEffect(() => {
    const path = 'locations';
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const locs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLocations(locs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, []);

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Keyboard shortcut for Admin Mode (Ctrl + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAdminMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsManagerOpen(false);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUserAdmin) return;

    const position: [number, number] = [parseFloat(formData.lat), parseFloat(formData.lng)];
    const path = 'locations';
    
    try {
      if (editingId) {
        const docRef = doc(db, path, editingId);
        await updateDoc(docRef, {
          name: formData.name,
          type: formData.type,
          position,
          description: formData.description,
          address: formData.address,
          whatsapp: formData.whatsapp,
          logoUrl: formData.logoUrl,
          isAccredited: formData.isAccredited,
          updatedAt: serverTimestamp()
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, path), {
          name: formData.name,
          type: formData.type,
          position,
          description: formData.description,
          address: formData.address,
          whatsapp: formData.whatsapp,
          logoUrl: formData.logoUrl,
          isAccredited: formData.isAccredited,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setCenter(position);
        setZoom(15);
      }
      
      setIsAddingLocation(false);
      setFormData({ 
        name: '', 
        type: 'Point of Interest', 
        lat: '', 
        lng: '',
        description: '',
        address: '',
        whatsapp: '',
        logoUrl: '',
        isAccredited: false
      });
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const startEditing = (loc: any) => {
    setEditingId(loc.id);
    setFormData({
      name: loc.name,
      type: loc.type,
      lat: loc.position[0].toString(),
      lng: loc.position[1].toString(),
      description: loc.description || '',
      address: loc.address || '',
      whatsapp: loc.whatsapp || '',
      logoUrl: loc.logoUrl || '',
      isAccredited: loc.isAccredited || false
    });
    setIsAddingLocation(true);
  };

  const removeLocation = async (id: string) => {
    if (!isUserAdmin) return;
    const path = 'locations';
    try {
      await deleteDoc(doc(db, path, id));
      if (selectedLocation?.id === id) {
        setSelectedLocation(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateLocationPosition = async (id: string, newPos: [number, number]) => {
    if (!isUserAdmin) return;
    const path = 'locations';
    try {
      const docRef = doc(db, path, id);
      await updateDoc(docRef, {
        position: newPos,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden font-sans">
      {/* Map Container */}
      <div className="w-full h-full">
        <MapContainer 
          center={center} 
          zoom={zoom} 
          scrollWheelZoom={true}
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={center} zoom={zoom} />
          <MapEvents onMapClick={() => setSelectedLocation(null)} />
          
          {locations.map((loc) => (
            <Marker 
              key={loc.id} 
              position={loc.position as [number, number]}
              icon={createCustomIcon(loc.type)}
              draggable={true}
              eventHandlers={{
                click: () => setSelectedLocation(loc),
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  updateLocationPosition(loc.id, [position.lat, position.lng]);
                }
              }}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-slate-900">{loc.name}</h3>
                  <p className="text-xs text-slate-500">{loc.type}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-8 right-8 z-[1000] flex flex-col gap-3">
        {isAdminMode && (
          <button 
            onClick={() => setIsManagerOpen(true)}
            className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 transition-colors flex items-center justify-center group"
            title="Gerenciar Marcações"
          >
            <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        )}
        <button className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xl hover:bg-slate-50 transition-colors text-slate-700">
          <Navigation size={20} />
        </button>
        <button className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xl hover:bg-slate-50 transition-colors text-slate-700">
          <Layers size={20} />
        </button>
      </div>

      {/* Management Panel Modal */}
      <AnimatePresence>
        {isManagerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">Gerenciador</h2>
                  {user && (
                    <span className={`px-2 py-0.5 ${isUserAdmin ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'} text-[10px] font-bold uppercase rounded-md`}>
                      {isUserAdmin ? 'Administrador' : 'Usuário'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {user ? (
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-bold"
                    >
                      <LogOut size={18} />
                      Sair
                    </button>
                  ) : (
                    <button 
                      onClick={handleLogin}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-bold shadow-lg shadow-blue-500/20"
                    >
                      <LogIn size={18} />
                      Entrar
                    </button>
                  )}
                  <button 
                    onClick={() => setIsManagerOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 ml-2"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {!isUserAdmin ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                      <Settings size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {!user ? 'Acesso Restrito' : 'Acesso Negado'}
                      </h3>
                      <p className="text-slate-500 text-sm">
                        {!user 
                          ? 'Faça login com sua conta Google para gerenciar as marcações.' 
                          : 'Você não tem permissão para gerenciar as marcações deste mapa.'}
                      </p>
                    </div>
                    {!user && (
                      <button 
                        onClick={handleLogin}
                        className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 inline-flex items-center gap-2"
                      >
                        <LogIn size={20} />
                        Login com Google
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* List of existing pins */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Pins Atuais</h3>
                      <div className="grid gap-3">
                        {locations.map((loc) => (
                          <div key={loc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                <MapPin size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">{loc.name}</h4>
                                <p className="text-xs text-slate-500">{loc.type} • {loc.position[0].toFixed(4)}, {loc.position[1].toFixed(4)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => startEditing(loc)}
                                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="Editar Pin"
                              >
                                <Pencil size={18} />
                              </button>
                              <button 
                                onClick={() => removeLocation(loc.id)}
                                className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Remover Pin"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {locations.length === 0 && (
                          <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                            Nenhum pin cadastrado.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add New Section */}
                    {!isAddingLocation ? (
                      <button 
                        onClick={() => {
                          setIsAddingLocation(true);
                          setEditingId(null);
                          setFormData({ 
                            name: '', 
                            type: 'Point of Interest', 
                            lat: '', 
                            lng: '',
                            description: '',
                            address: '',
                            whatsapp: '',
                            logoUrl: '',
                            isAccredited: false
                          });
                        }}
                        className="w-full py-4 border-2 border-dashed border-blue-200 text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={20} />
                        Adicionar Nova Marcação
                      </button>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50 p-6 rounded-3xl border border-blue-100"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-slate-900">{editingId ? 'Editar Marcação' : 'Novo Cadastro'}</h3>
                          <button 
                            onClick={() => {
                              setIsAddingLocation(false);
                              setEditingId(null);
                            }} 
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <form onSubmit={handleAddLocation} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome do Local</label>
                              <input
                                required
                                type="text"
                                placeholder="Ex: Praça Floriano Peixoto"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">URL da Logomarca</label>
                              <input
                                type="url"
                                placeholder="https://exemplo.com/logo.png"
                                value={formData.logoUrl}
                                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descrição / Subtexto</label>
                            <textarea
                              placeholder="Fale um pouco sobre este local ou empresa..."
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[80px]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Endereço Completo</label>
                            <input
                              type="text"
                              placeholder="Rua, Número, Bairro, Cidade - UF"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">WhatsApp (com DDD)</label>
                            <input
                              type="text"
                              placeholder="Ex: 96991234567"
                              value={formData.whatsapp}
                              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo</label>
                              <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                              >
                                <option>Landmark</option>
                                <option>Historical</option>
                                <option>Attraction</option>
                                <option>Park</option>
                                <option>Cultural</option>
                                <option>Batedeira credenciada da rede açaí</option>
                                <option>Point of Interest</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lat</label>
                                <input
                                  required
                                  type="number"
                                  step="any"
                                  value={formData.lat}
                                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lng</label>
                                <input
                                  required
                                  type="number"
                                  step="any"
                                  value={formData.lng}
                                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl">
                            <input
                              type="checkbox"
                              id="isAccredited"
                              checked={formData.isAccredited}
                              onChange={(e) => setFormData({ ...formData, isAccredited: e.target.checked })}
                              className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="isAccredited" className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                              <ShieldCheck size={18} className="text-green-600" />
                              Participante da rede
                            </label>
                          </div>

                          <div className="pt-2 flex gap-3">
                            <button 
                              type="button"
                              onClick={() => {
                                setIsAddingLocation(false);
                                setEditingId(null);
                              }}
                              className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-white transition-colors"
                            >
                              Cancelar
                            </button>
                            <button 
                              type="submit"
                              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                            >
                              {editingId ? 'Atualizar' : 'Salvar'}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Card Overlay */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="absolute bottom-8 left-8 z-[1000] w-full max-w-sm px-4 sm:px-0"
          >
            <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              {/* Accreditation Badge */}
              {selectedLocation.isAccredited && selectedLocation.type === 'Batedeira credenciada da rede açaí' && (
                <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-2xl flex items-center gap-1.5 shadow-sm z-10">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Participante</span>
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  {selectedLocation.logoUrl ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50">
                      <img 
                        src={selectedLocation.logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <div>
                    {selectedLocation.type !== 'Batedeira credenciada da rede açaí' && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full mb-2">
                        {selectedLocation.type}
                      </span>
                    )}
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">
                      {selectedLocation.name}
                    </h2>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLocation(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-slate-600 text-sm leading-relaxed">
                  {selectedLocation.description || `Conheça o ${selectedLocation.name}, um dos pontos mais importantes de Macapá, a capital do meio do mundo.`}
                </p>

                {selectedLocation.address && (
                  <div className="flex items-start gap-3 text-slate-500">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-tight">{selectedLocation.address}</p>
                  </div>
                )}
                
                <div className="flex flex-col gap-2 pt-2">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.position[0]},${selectedLocation.position[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                  >
                    <Navigation size={18} />
                    Como chegar (Google Maps)
                  </a>

                  {selectedLocation.isAccredited && selectedLocation.type === 'Batedeira credenciada da rede açaí' && selectedLocation.whatsapp && (
                    <a 
                      href={`https://wa.me/55${selectedLocation.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-[#25D366] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#20ba5a] transition-all shadow-lg shadow-green-500/10"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.672 1.433 5.66 1.434h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Enviar mensagem (WhatsApp)
                    </a>
                  )}
                </div>
                
                {selectedLocation.isAccredited && selectedLocation.type === 'Batedeira credenciada da rede açaí' && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-2xl border border-green-100">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                      <Store size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Rede Açaí</p>
                      <p className="text-xs text-green-600 font-medium">Estabelecimento Participante da rede</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
