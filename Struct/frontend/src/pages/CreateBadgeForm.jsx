import React, { useState } from "react";
import shape1 from "../assets/shape1.png"; // Import shape images
import shape2 from "../assets/shape2.png";
import shape3 from "../assets/shape3.png";
import shape4 from "../assets/shape4.png";

import design1 from "../assets/design1.png"; // Import design images
import design2 from "../assets/design2.png"; // a
import design3 from "../assets/design3.png";
import design4 from "../assets/design4.png";

const CreateBadgeForm = () => {
  const [badgeType, setBadgeType] = useState("1st");
  const [badgeName, setBadgeName] = useState("");
  const [badgeDescription, setBadgeDescription] = useState("");
  const [selectedShape, setSelectedShape] = useState("shape1");
  const [selectedDesign, setSelectedDesign] = useState("design1");
  const [showModal, setShowModal] = useState(false);

  // Array of shapes
  const shapes = [
    { id: "shape1", src: shape1, alt: "Shape 1" },
    { id: "shape2", src: shape2, alt: "Shape 2" },
    { id: "shape3", src: shape3, alt: "Shape 3" },
    { id: "shape4", src: shape4, alt: "Shape 4" },
  ];

  // Array of designs
  const designs = [
    { id: "design1", src: design1, alt: "Design 1" },
    { id: "design2", src: design2, alt: "Design 2" },
    { id: "design3", src: design3, alt: "Design 3" },
    { id: "design4", src: design4, alt: "Design 4" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="bg-gradient-to-r from-teal-500 to-teal-600 min-h-screen flex items-center justify-center">
      <div className="bg-white p-3 sm:p-5 rounded-lg shadow-lg w-full max-w-md sm:max-w-3xl mt-12">
        {/* Header */}
        <h2 className="text-base sm:text-lg font-bold text-teal-500 text-center mb-2 sm:mb-3">
          Create a Badge
        </h2>
        <p className="text-gray-600 text-center mb-3 sm:mb-4 text-xs sm:text-sm">
          Design and customize badges for 1st, 2nd, 3rd, and Participation
          awards.
        </p>

        {/* Badge Creation Form */}
        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
          {/* Badge Type */}
          <div>
            <label
              htmlFor="badgeType"
              className="block text-xs sm:text-sm font-medium text-gray-700"
            >
              Badge Type
            </label>
            <select
              id="badgeType"
              value={badgeType}
              onChange={(e) => setBadgeType(e.target.value)}
              className="mt-1 block w-full px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-xs sm:text-sm"
            >
              <option value="1st">1st Place</option>
              <option value="2nd">2nd Place</option>
              <option value="3rd">3rd Place</option>
              <option value="Participation">Participation</option>
            </select>
          </div>

          {/* Badge Name */}
          <div>
            <label
              htmlFor="badgeName"
              className="block text-xs sm:text-sm font-medium text-gray-700"
            >
              Badge Name
            </label>
            <input
              type="text"
              id="badgeName"
              value={badgeName}
              onChange={(e) => {
                if (e.target.value.length <= 30) {
                  setBadgeName(e.target.value);
                }
              }}
              className="mt-1 block w-full px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-xs sm:text-sm"
              placeholder="Enter badge name (max 30 characters)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {badgeName.length}/30 characters
            </p>
          </div>

          {/* Badge Description */}
          <div>
            <label
              htmlFor="badgeDescription"
              className="block text-xs sm:text-sm font-medium text-gray-700"
            >
              Badge Description
            </label>
            <textarea
              id="badgeDescription"
              value={badgeDescription}
              onChange={(e) => {
                if (e.target.value.length <= 150) {
                  setBadgeDescription(e.target.value);
                }
              }}
              className="mt-1 block w-full px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-xs sm:text-sm resize-none"
              placeholder="Enter a description for the badge (max 150 characters)"
              rows="4"
              required
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">
              {badgeDescription.length}/150 characters
            </p>
          </div>

          {/* Shape Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Select Badge Shape
            </label>
            <div className="flex items-center space-x-1 sm:space-x-2">
              {shapes.map((shape) => (
                <div
                  key={shape.id}
                  className={`cursor-pointer p-1 sm:p-2 border-2 rounded-lg ${
                    selectedShape === shape.id
                      ? "border-teal-500"
                      : "border-gray-300"
                  }`}
                  onClick={() => setSelectedShape(shape.id)}
                >
                  <img
                    src={shape.src}
                    alt={shape.alt}
                    className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Design Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Select Badge Design
            </label>
            <div className="flex items-center space-x-1 sm:space-x-2">
              {designs.map((design) => (
                <div
                  key={design.id}
                  className={`cursor-pointer p-1 sm:p-2 border-2 rounded-lg ${
                    selectedDesign === design.id
                      ? "border-teal-500"
                      : "border-gray-300"
                  }`}
                  onClick={() => setSelectedDesign(design.id)}
                >
                  <img
                    src={design.src}
                    alt={design.alt}
                    className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-teal-500 text-white py-2 sm:py-2.5 px-3 rounded-lg shadow-md hover:bg-teal-600 transition duration-300 text-xs sm:text-sm"
          >
            Create Badge
          </button>
        </form>
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold text-teal-500 text-center mb-3">
              Badge Created!
            </h3>
            <div className="relative w-80 h-80 mx-auto">
              {/* Badge Shape */}
              <img
                src={shapes.find((shape) => shape.id === selectedShape)?.src}
                alt="Badge Shape"
                className="w-full h-full object-contain"
              />
              {/* Badge Design */}
              <img
                src={
                  designs.find((design) => design.id === selectedDesign)?.src
                }
                alt="Badge Design"
                className="absolute inset-0 w-56 h-56 object-contain m-auto"
              />
            </div>
            <p className="text-center mt-3 text-gray-600 text-sm">
              <strong>{badgeName}</strong>: {badgeDescription}
            </p>
            <button
              onClick={handleCloseModal}
              className="mt-3 w-full bg-teal-500 text-white py-2 px-3 rounded-lg shadow-md hover:bg-teal-600 transition duration-300 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBadgeForm;
