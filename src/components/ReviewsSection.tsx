import React, { useState } from 'react';
import { Star, CheckCircle, Image as ImageIcon, ThumbsUp, Upload, Filter, Plus } from 'lucide-react';
import { Review } from '../types';
import { uploadReviewImage } from '../utils/imageOptimizer';

interface ReviewsSectionProps {
  reviews: Review[];
  onAddReview: (review: Review) => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews, onAddReview }) => {
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [onlyPhotos, setOnlyPhotos] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form state
  const [newAuthor, setNewAuthor] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newImage, setNewImage] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const filteredReviews = reviews.filter((r) => {
    if (filterRating !== 'all' && r.rating !== filterRating) return false;
    if (onlyPhotos && !r.imageUrl) return false;
    return true;
  });

  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingPhoto(true);
      try {
        const uploadedUrl = await uploadReviewImage(file);
        setNewImage(uploadedUrl);
      } catch (err) {
        console.warn('Error al subir imagen de reseña:', err);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newComment.trim()) return;

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      author: newAuthor.trim(),
      location: newLocation.trim() || 'Argentina',
      rating: newRating,
      date: 'Reciente (Hoy)',
      title: newTitle.trim() || 'Excelente producto y atención',
      comment: newComment.trim(),
      verifiedBuyer: true,
      imageUrl: newImage || undefined
    };

    onAddReview(newRev);
    // Reset
    setNewAuthor('');
    setNewLocation('');
    setNewRating(5);
    setNewTitle('');
    setNewComment('');
    setNewImage('');
    setIsModalOpen(false);
  };

  return (
    <section id="reviews-section" className="py-16 sm:py-24 border-t border-white/10 bg-[#0D0D0D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              EXPERIENCIAS REALES DE CLIENTES
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
              Opiniones de Barberos y Clientes
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              Más de 1.400 clientes en todo el país ya cortan con la EXXTRA TECH™ de BB IMPORT.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            id="write-review-button"
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Escribir una Reseña</span>
          </button>
        </div>

        {/* Aggregate Ratings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 bg-[#121212] border border-white/10 rounded-2xl shadow-xl">
          {/* Big Score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-white/10">
            <span className="text-5xl sm:text-6xl font-black text-amber-500 font-mono">
              {avgRating}
            </span>
            <div className="flex text-amber-400 text-xl tracking-tighter my-2">
              ★★★★★
            </div>
            <p className="text-xs font-bold text-zinc-300">
              Basado en {reviews.length} reseñas verificadas
            </p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <CheckCircle className="w-3.5 h-3.5" /> 98.4% de satisfacción general
            </p>
          </div>

          {/* Rating Bars & Quick Filters */}
          <div className="md:col-span-8 flex flex-col justify-center gap-2 px-2 sm:px-6">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((r) => r.rating === stars).length;
              const percent = Math.round((count / (reviews.length || 1)) * 100);
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => setFilterRating(filterRating === stars ? 'all' : stars)}
                    className={`flex items-center gap-1 w-14 font-mono font-bold transition-colors cursor-pointer ${
                      filterRating === stars ? 'text-amber-400 underline' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{stars}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </button>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}

            {/* Filter Pills */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5 flex-wrap">
              <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mr-1">
                Filtrar:
              </span>
              <button
                onClick={() => setFilterRating('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  filterRating === 'all'
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                Todas ({reviews.length})
              </button>
              <button
                onClick={() => setFilterRating(5)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  filterRating === 5
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                Solo 5 Estrellas
              </button>
              <button
                onClick={() => setOnlyPhotos(!onlyPhotos)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  onlyPhotos
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Con Fotos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-2xl bg-[#121212] border border-white/10 flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition-all shadow-lg"
            >
              <div className="space-y-3">
                {/* Author & Rating */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {rev.author}
                      {rev.verifiedBuyer && (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 inline" />
                      )}
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      {rev.location} {rev.role && `• ${rev.role}`}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">{rev.date}</span>
                </div>

                <div className="flex text-amber-400 text-xs tracking-tighter">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < rev.rating ? 'text-amber-400' : 'text-zinc-700'}>
                      ★
                    </span>
                  ))}
                </div>

                {/* Title & Comment */}
                <h5 className="text-xs font-black text-zinc-200 uppercase tracking-wide">
                  "{rev.title}"
                </h5>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {rev.comment}
                </p>

                {/* Optional Customer Photo */}
                {rev.imageUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-white/10 aspect-video bg-zinc-900">
                    <img
                      src={rev.imageUrl}
                      alt={`Foto reseña de ${rev.author}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Verified badge bottom */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                <span className="text-emerald-400 font-mono font-semibold">
                  ✓ Comprador Verificado BB IMPORT
                </span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <ThumbsUp className="w-3 h-3" /> Útil
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Escribir Reseña del Producto
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold uppercase tracking-wider mb-1">
                  Tu Calificación:
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="text-2xl cursor-pointer transition-transform hover:scale-110"
                    >
                      <span className={star <= newRating ? 'text-amber-400' : 'text-zinc-700'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold uppercase tracking-wider mb-1">
                    Tu Nombre:
                  </label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Ej: Nicolás M."
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold uppercase tracking-wider mb-1">
                    Ciudad / Provincia:
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Ej: Córdoba"
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold uppercase tracking-wider mb-1">
                  Título de tu experiencia:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Excelente corte y batería increíble"
                  className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold uppercase tracking-wider mb-1">
                  Tu comentario detallado:
                </label>
                <textarea
                  required
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="¿Cómo corta la máquina? ¿Qué te pareció el envío y la atención?"
                  className="w-full bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold uppercase tracking-wider mb-1">
                  Subir foto de tu corte o del kit (Opcional):
                </label>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-white/10 hover:border-amber-500/40 rounded-xl cursor-pointer bg-white/5 transition-colors">
                  <Upload className="w-4 h-4 text-amber-500" />
                  <span className="text-zinc-300">
                    {newImage ? 'Foto seleccionada ✓' : 'Examinar foto desde tu equipo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {newImage && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-amber-500">
                    <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase rounded-xl tracking-wider shadow-lg"
                >
                  Publicar Reseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
