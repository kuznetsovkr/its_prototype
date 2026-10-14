import { socialAssets } from "../images/home/social";

const labels = [
  "Девушка с доберманом в одежде с вышивкой",
  "Прогулка с собакой в футболке с вышивкой",
  "Парные футболки с вышивкой на прогулке с собакой",
  "Худи с вышивкой автомобиля",
  "Футболка с вышивкой и собака на берегу",
];

export const homeSocialItems = socialAssets.map((asset, index) => ({
  id: `social-${String(index + 1).padStart(2, "0")}`,
  label: labels[index],
  ...asset,
}));

// Keep the approved compact layout: the three middle publications.
export const compactSocialItems = homeSocialItems.slice(1, 4);
