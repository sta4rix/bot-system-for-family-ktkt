import { SeparatorSpacingSize } from "discord.js";
import { COLORS, EMOJIS } from "../config/constants.js";

export const THEME = {
  colors: {
    success: COLORS.SUCCESS,
    error: COLORS.ERROR,
    warning: COLORS.WARNING,
    info: COLORS.INFO,
    primary: COLORS.PRIMARY,
    dark: COLORS.DARK,
    purple: COLORS.PURPLE,
    gold: COLORS.GOLD
  },
  emojis: EMOJIS,
  spacing: {
    small: SeparatorSpacingSize.Small,
    large: SeparatorSpacingSize.Large
  }
};
