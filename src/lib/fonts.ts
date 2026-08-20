import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';

// Google's static exports name every weight except 400/700 as its own family
// ("Figtree SemiBold", not "Figtree" at weight 600), so `fontFamily` +
// `fontWeight` synthesizes rather than resolves on iOS. Registering one
// family per weight makes weight a token instead of a hint — which is why
// nothing outside text.tsx should ever set a font-* class directly.
export const FONTS = {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
};
