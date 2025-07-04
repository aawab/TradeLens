// Shared constants for backend API routes
export const VALID_FEATURES = ['co2_emissions', 'gdp', 'population', 'life_expectancy'];

export const validateFeature = (feature) => VALID_FEATURES.includes(feature); 