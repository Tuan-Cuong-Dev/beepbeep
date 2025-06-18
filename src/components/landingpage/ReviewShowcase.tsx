'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

const mockReviews = [
  {
    id: '71c5995d-f760-44ea-919c-a3527805dde9',
    type: 'Station',
    refId: '2joa2W7L4v9IuyFJkAen',
    name: 'The Motorbike Station - Hue City',
    rating: 4.6,
    review: 'Highly recommend!',
    reviewerName: 'Tomoko',
    createdAt: '2025-04-12T15:09:27.648951',
  },
  {
    id: 'cb6048fd-7b4d-4eb3-a700-23abdbbb849f',
    type: 'Station',
    refId: '2joa2W7L4v9IuyFJkAen',
    name: 'The Motorbike Station - Hue City',
    rating: 4.7,
    review: 'Great experience!',
    reviewerName: 'Chris D.',
    createdAt: '2025-04-12T15:12:11.140545',
  },
  {
    id: '579e331f-44c6-455b-a7da-33f49e60ee57',
    type: 'Station',
    refId: '2joa2W7L4v9IuyFJkAen',
    name: 'The Motorbike Station - Hue City',
    rating: 4.9,
    review: 'Loved the power and design!',
    reviewerName: 'Lan Pham',
    createdAt: '2025-04-12T15:12:11.140876',
  },
  {
    id: '03d7345e-bb15-4f3e-9ec4-13034e08128d',
    type: 'eBikeModel',
    refId: 'EiSfLC1DaPpXsyG4001k',
    name: 'Selex Camel 2',
    rating: 4.9,
    review: 'Loved the power and design!',
    reviewerName: 'Tomoko',
    createdAt: '2025-04-12T15:09:27.649316',
    imageUrl: 'https://drive.google.com/uc?export=view&id=1_C7kuF2PPnQnr-q3rda1a5z38gA2t0ir'
  },
  {
    id: 'ead7f09f-4793-4979-8c64-3c2b1c7dfc0d',
    type: 'eBikeModel',
    refId: 'EiSfLC1DaPpXsyG4001k',
    name: 'Selex Camel 2',
    rating: 4.9,
    review: 'Fast delivery and clean bikes.',
    reviewerName: 'Minh Nguyen',
    createdAt: '2025-04-12T15:12:11.141097',
    imageUrl: 'https://drive.google.com/uc?export=view&id=1_C7kuF2PPnQnr-q3rda1a5z38gA2t0ir'
  },
  {
    id: 'extra-fake-id-123',
    type: 'eBikeModel',
    refId: 'EiSfLC1DaPpXsyG4001k',
    name: 'Selex Camel 2',
    rating: 4.8,
    review: 'Smooth ride and easy process.',
    reviewerName: 'Anna T.',
    createdAt: '2025-04-12T15:12:11.141300',
    imageUrl: 'https://drive.google.com/uc?export=view&id=1_C7kuF2PPnQnr-q3rda1a5z38gA2t0ir'
  },
];

export default function ReviewShowcase() {
  const [stationReviews, setStationReviews] = useState([]);
  const [modelReviews, setModelReviews] = useState([]);

  useEffect(() => {
    setStationReviews(mockReviews.filter((r) => r.type === 'Station'));
    setModelReviews(mockReviews.filter((r) => r.type === 'eBikeModel'));
  }, []);

  const renderReviewCard = (item) => (
    <div
      key={item.id}
      className="bg-gray-50 border rounded-lg p-6 shadow hover:shadow-lg transition"
    >
      {item.type === 'eBikeModel' && item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-40 object-cover rounded-md mb-4"
        />
      )}
      <h3 className="text-lg font-semibold text-[#00d289]">{item.name}</h3>
      <div className="flex justify-center items-center gap-1 my-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            fill={i < Math.round(item.rating) ? '#FFD700' : 'none'}
            stroke="#FFD700"
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{item.rating.toFixed(1)}</span>
      </div>
      <p className="text-gray-700 italic mb-4">"{item.review}"</p>
      <p className="text-sm text-gray-500">— {item.reviewerName}</p>
    </div>
  );

  return (
    <section className=" py-12 px-4 text-center bg-gray-100">
      <div className="max-w-7xl mx-auto space-y-14 ">
        <div>
          <h2 className="text-gray-800 text-2xl md:text-3xl font-bold  mb-6">
            Station Reviews
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stationReviews.length > 0 ? (
              stationReviews.map(renderReviewCard)
            ) : (
              <p className="text-gray-500 italic col-span-full">
                No station reviews yet.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-gray-800 text-2xl md:text-3xl font-bold  mb-6 mt-4">
            Vehicle Model Reviews
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modelReviews.length > 0 ? (
              modelReviews.map(renderReviewCard)
            ) : (
              <p className="text-gray-500 italic col-span-full">
                No Vehicle model reviews yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}