export const EVENT_CARD_COLOR_STANDARD = "standard";
export const EVENT_CARD_COLOR_RAINBOW = "rainbow";
export const EVENT_CARD_ANIMATION_NONE = "none";
export const EVENT_CARD_ANIMATION_BUBBLES = "bubbles";
export const EVENT_CARD_ANIMATION_BEER = "beer";

export type EventCardColor = typeof EVENT_CARD_COLOR_STANDARD | typeof EVENT_CARD_COLOR_RAINBOW;
export type EventCardAnimation =
  | typeof EVENT_CARD_ANIMATION_NONE
  | typeof EVENT_CARD_ANIMATION_BUBBLES
  | typeof EVENT_CARD_ANIMATION_BEER;

export function normalizeEventCardColor(value: string | null | undefined): EventCardColor {
  return value === EVENT_CARD_COLOR_RAINBOW ? EVENT_CARD_COLOR_RAINBOW : EVENT_CARD_COLOR_STANDARD;
}

export function normalizeEventCardAnimation(value: string | null | undefined): EventCardAnimation {
  if (value === EVENT_CARD_ANIMATION_BEER) {
    return EVENT_CARD_ANIMATION_BEER;
  }

  return value === EVENT_CARD_ANIMATION_BUBBLES ? EVENT_CARD_ANIMATION_BUBBLES : EVENT_CARD_ANIMATION_NONE;
}

export function isBeerCardAnimation(animation?: string | null) {
  return normalizeEventCardAnimation(animation) === EVENT_CARD_ANIMATION_BEER;
}

export function getPosterEventStyleClass(
  color?: string | null,
  animation?: string | null,
) {
  const beer = isBeerCardAnimation(animation);

  return [
    normalizeEventCardColor(color) === EVENT_CARD_COLOR_RAINBOW ? "poster-event-legendary" : "",
    beer ? "poster-event-beer" : "",
    !beer && normalizeEventCardAnimation(animation) === EVENT_CARD_ANIMATION_BUBBLES ? "poster-event-bubbles" : "",
  ].filter(Boolean).join(" ");
}
