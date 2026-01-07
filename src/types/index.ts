export interface CreateAuctionDTO {
  title: string;
  description?: string;
  imageUrl?: string;
  totalItems: number;
  itemsPerRound: number;
  minBid: number;
  roundEndsAt: Date;
  antiSnipingSeconds?: number;
}

export interface CreateBidDTO {
  auctionId: string;
  userId: string;
  amount: number;
}

export interface CreateUserDTO {
  username: string;
}

export interface AuctionState {
  auctionId: string;
  currentRound: number;
  remainingItems: number;
  topBids: LeaderboardEntry[];
  minWinningBid: number;
  endsAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  odId: string;
  amount: number;
  username: string;
}

export interface RoundResult {
  round: number;
  winners: WinnerEntry[];
  carriedBids: string[];
}

export interface WinnerEntry {
  odId: string;
  odId: string;
  itemNumber: number;
  amount: number;
}
