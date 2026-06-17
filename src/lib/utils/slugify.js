export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function generateVotePackages(basePrice) {
  const packages = [
    { votes: 1, multiplier: 1, order: 0 },
    { votes: 5, multiplier: 4.5, order: 1 },
    { votes: 10, multiplier: 8, order: 2, highlighted: true },
    { votes: 25, multiplier: 18, order: 3 },
    { votes: 50, multiplier: 30, order: 4 },
    { votes: 100, multiplier: 50, order: 5 },
  ];

  return packages.map(pkg => ({
    votes: pkg.votes,
    price_ghs: Math.round(basePrice * pkg.multiplier * 100) / 100,
    is_highlighted: pkg.highlighted || false,
    display_order: pkg.order,
  }));
}