/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Map from './components/Map';
import { motion } from 'motion/react';
import { MapPin, ShieldCheck, Store, ChevronRight, Menu, X, Instagram, Facebook, Mail, Phone } from 'lucide-react';
import { useState } from 'react';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[3000] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <Store size={24} />
              </div>
              <span className="text-xl font-display font-bold tracking-tight text-slate-900">Rede Açaí</span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-sm font-medium text-slate-600 hover:text-purple-700 transition-colors">Início</a>
              <a href="#mapa" className="text-sm font-medium text-slate-600 hover:text-purple-700 transition-colors">Mapa da Rede</a>
              <a href="#sobre" className="text-sm font-medium text-slate-600 hover:text-purple-700 transition-colors">Sobre Nós</a>
              <a href="#contato" className="px-5 py-2.5 bg-purple-700 text-white rounded-full text-sm font-bold hover:bg-purple-800 transition-all shadow-lg shadow-purple-500/20">
                Seja um Parceiro
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-b border-slate-100 p-4 space-y-4"
          >
            <a href="#home" className="block text-base font-medium text-slate-600" onClick={() => setIsMenuOpen(false)}>Início</a>
            <a href="#mapa" className="block text-base font-medium text-slate-600" onClick={() => setIsMenuOpen(false)}>Mapa da Rede</a>
            <a href="#sobre" className="block text-base font-medium text-slate-600" onClick={() => setIsMenuOpen(false)}>Sobre Nós</a>
            <button className="w-full py-3 bg-purple-700 text-white rounded-xl font-bold">Seja um Parceiro</button>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={14} />
                Qualidade Garantida
              </div>
              <h1 className="text-5xl sm:text-6xl font-display font-bold text-slate-900 leading-[1.1]">
                Encontre o melhor <span className="text-purple-700">Açaí de Macapá</span> em um só lugar.
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                Mapeamos as batedeiras credenciadas e os pontos turísticos mais icônicos da capital do meio do mundo. Qualidade, tradição e sabor original.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#mapa" className="px-8 py-4 bg-purple-700 text-white rounded-2xl font-bold hover:bg-purple-800 transition-all shadow-xl shadow-purple-500/25 flex items-center gap-2 group">
                  Explorar Mapa
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="#sobre" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                  Saiba Mais
                </a>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl rotate-3">
                <img 
                  src="https://picsum.photos/seed/acai/800/800" 
                  alt="Açaí Bowl" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 -rotate-3 hidden sm:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">100% Certificado</p>
                    <p className="text-xs text-slate-500">Padrão de qualidade Rede Açaí</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section id="mapa" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">Mapa Interativo</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Navegue por Macapá e encontre batedeiras credenciadas, pontos turísticos e locais de interesse.
            </p>
          </div>
          
          <div className="h-[700px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white relative">
            <Map />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="sobre" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mb-6">
                <MapPin size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Localização Precisa</h3>
              <p className="text-slate-600 leading-relaxed">
                Encontre exatamente onde estão as melhores batedeiras da cidade com geolocalização em tempo real.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-14 h-14 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Selo de Qualidade</h3>
              <p className="text-slate-600 leading-relaxed">
                Apenas estabelecimentos que seguem rigorosos padrões de higiene e tradição recebem nosso selo.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-6">
                <Store size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Suporte ao Produtor</h3>
              <p className="text-slate-600 leading-relaxed">
                Fortalecemos a economia local conectando batedores tradicionais diretamente com os consumidores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white">
                  <Store size={24} />
                </div>
                <span className="text-2xl font-display font-bold tracking-tight">Rede Açaí</span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed">
                A maior rede de batedeiras credenciadas do Amapá. Preservando a cultura e o sabor do nosso estado.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors">
                  <Facebook size={20} />
                </a>
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="font-bold text-lg">Links Rápidos</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#home" className="hover:text-white transition-colors">Início</a></li>
                <li><a href="#mapa" className="hover:text-white transition-colors">Mapa</a></li>
                <li><a href="#sobre" className="hover:text-white transition-colors">Sobre</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-lg">Contato</h4>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-purple-500" />
                  contato@redeacai.com.br
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-purple-500" />
                  (96) 99999-9999
                </li>
                <li className="flex items-center gap-3">
                  <MapPin size={18} className="text-purple-500" />
                  Macapá, Amapá
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            <p>&copy; 2026 Rede Açaí. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
