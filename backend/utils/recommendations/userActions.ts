export function getPriceRangeBounds(priceRange: PriceRange): number[] {
  switch (priceRange) {
    case "zero_to_ten":
      return [0, 10];
    case "ten_to_twenty_five":
      return [10, 25];
    case "twenty_five_to_fifty":
      return [25, 50];
    case "fifty_to_hundred":
      return [50, 100];
    case "hundred_to_three_hundred":
      return [100, 300];
    case "three_hundred_to_thousand":
      return [300, 1000];
    case "thousand_to_five_thousand":
      return [1000, 5000];
    case "five_thousand_to_ten_thousand":
      return [5000, 10000];
    case "ten_thousand_plus":
      return [10000, 1000000000];
    default:
      return [0, 1000000000];
  }
}
