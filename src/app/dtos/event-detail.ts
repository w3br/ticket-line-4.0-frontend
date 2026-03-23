import {ArtistSuggestion} from "./artist-suggestion";

/**
 * Interface representing detailed information about an event.
 */
export interface EventDetailDto {
  id: number;
  title: string;
  description: string;
  type: string;
  category: string;
  imageUrl: string;
  artists: ArtistSuggestion[];
}
