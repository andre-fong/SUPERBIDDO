
import React from 'react';
import { Grid, Card, CardMedia, Box, Typography, CardContent, Skeleton } from '@mui/material';
import { AuctionListings, AuctionStatus } from '@/types/auctionTypes';
import StatusLabel from './statusLabel';
import { styled } from "@mui/material/styles";
import { PageName } from '@/types/pageTypes';

const CardContentNoPadding = styled(CardContent)(`
    padding: 6px;
    &:last-child {
      padding-bottom: 0;
      margin-bottom: 10px;
    }
  `);

interface ListingsGalleryProps {
    auctions: AuctionListings[];
    setCurPage: (page: PageName, context?: string) => void;
    isLoaded: boolean;
}

const handleCardClick = (event: React.MouseEvent<HTMLDivElement>, auctionId: string, setCurPage: (page: PageName, context?: string) => void) => {
    setCurPage("auction", JSON.stringify({auctionId: auctionId}))
};

const ListingsGallery: React.FC<ListingsGalleryProps> = ({ auctions, setCurPage, isLoaded }) => {
    return (
        <Grid container spacing={2}>
            {isLoaded ? auctions.map((auction) => (
                <Grid item xs={12} sm={6} md={4} key={auction.auctionId}>
                    <Card onClick={(event) => handleCardClick(event, auction.auctionId, setCurPage)}>
                        <CardMedia
                            component="img"
                            height="140"
                            image={auction.imageUrl ? auction.imageUrl : "https://via.placeholder.com/300"}
                            alt={auction.name}
                            sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                        />
                        <CardContentNoPadding sx={{ padding: '12px' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" component="div" noWrap sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {auction.name}
                                </Typography>
                                <StatusLabel status={auction.status} />
                            </Box>
                            <Typography variant="h6" color="text.primary" sx={{ mb: '4px' }}>
                                {auction.topBid !== null ? `$${auction.topBid}` : 'No bids yet'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                                {auction.description ? auction.description : <i>No description</i>}
                            </Typography>
                            <Typography fontWeight="bold" variant="body2" color="text.secondary" display="flex" gap="4px">
                                <span>Number of Bids:</span> <span style={{ fontWeight: "400" }}>{auction.numberOfBids}</span>
                            </Typography>
                            <Typography fontWeight="bold" variant="body2" color="text.secondary">
                                <span>{auction.endDate ? auction.endDate.toLocaleString() : 'Not scheduled'}</span>
                            </Typography>
                        </CardContentNoPadding>
                    </Card>
                </Grid>
            )): 
                [...Array(9)].map((_, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card>
                            <CardMedia>
                                <Skeleton variant="rectangular" height={140} />
                            </CardMedia>
                            <CardContentNoPadding>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Skeleton variant="text" width="60%" />
                                    <Skeleton variant="circular" width={24} height={24} />
                                </Box>
                                <Skeleton variant="text" width="40%" />
                                <Skeleton variant="text" width="80%" />
                                <Skeleton variant="text" width="50%" />
                                <Skeleton variant="text" width="70%" />
                            </CardContentNoPadding>
                        </Card>
                    </Grid>
                ))
            }
        </Grid>
    );
};

export default ListingsGallery;