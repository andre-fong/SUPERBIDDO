import React, { useState, useEffect } from "react";
import { Container, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, ListItemText, OutlinedInput, Box, Typography, Grid, Card, CardMedia, CardContent, SelectChangeEvent, Pagination } from "@mui/material";
import { User } from "@/types/userTypes";
import { AuctionStatus, AuctionStatusEnum, Auction } from "@/types/auctionTypes";
import ListingsGallery from "@/components/listingsGallery";

const cardPerPage = 9;

interface YourListingsProps {
  user: User | null;
}

const auctionStatuses: AuctionStatus[] = Object.values(AuctionStatusEnum).map(status => status.toString() as AuctionStatus);

const auctionsDB: Auction[] = [
  {
    auctionId: 1, name: "Auction 1", status: AuctionStatusEnum.Scheduled, image: null, description: "Brief details about Auction 1",
    topBid: null,
    numberOfBids: 0,
    endDate: new Date('2023-12-01T10:00:00Z')
  },
  {
    auctionId: 2, name: "Auction 2", status: AuctionStatusEnum.Ongoing, image: "frontend/app/api/bf954e31-015a-4646-8333-40225c847bcc_1024x1024.webp", description: "Brief details about Auction 2",
    topBid: null,
    numberOfBids: 0,
    endDate: new Date('2023-12-02T15:00:00Z')
  },
  {
    auctionId: 3, name: "Auction 3", status: AuctionStatusEnum.Ongoing, image: "image3.jpg", description: "Brief details about Auction 3",
    topBid: 0.34,
    numberOfBids: 0,
    endDate: new Date('2023-12-03T20:00:00Z')
  },
  {
    auctionId: 4, name: "Auction 4asdasdasdasdasdasdasdasdasdsadasdsad", status: AuctionStatusEnum.Ongoing, image: "image4.jpg", description: "Brief details about Auadssssssssssssssssssssction 4",
    topBid: 1,
    numberOfBids: 0,
    endDate: new Date('2023-12-04T18:00:00Z')
  },
{
  auctionId: 5, name: "Auction 5", status: AuctionStatusEnum.Successful, image: "image5.jpg", description: "Brief details about Auction 5",
  topBid: 5.00,
  numberOfBids: 10,
  endDate: new Date('2023-12-05T12:00:00Z')
},
{
  auctionId: 6, name: "Auction 6", status: AuctionStatusEnum.Scheduled, image: "image6.jpg", description: "Brief details about Auction 6",
  topBid: null,
  numberOfBids: 0,
  endDate: new Date('2023-12-06T14:00:00Z')
},
{
  auctionId: 7, name: "Auction 7", status: AuctionStatusEnum.Ongoing, image: "image7.jpg", description: "Brief details about Auction 7",
  topBid: 2.50,
  numberOfBids: 5,
  endDate: new Date('2023-12-07T16:00:00Z')
},
{
  auctionId: 8, name: "Auction 8", status: AuctionStatusEnum.Unsuccessful, image: "image8.jpg", description: "Brief details about Auction 8",
  topBid: 3.75,
  numberOfBids: 8,
  endDate: new Date('2023-12-08T18:00:00Z')
},
{
  auctionId: 9, name: "Auction 9", status: AuctionStatusEnum.Scheduled, image: "image9.jpg", description: "Brief details about Auction 9",
  topBid: null,
  numberOfBids: 0,
  endDate: new Date('2023-12-09T20:00:00Z')
},
{
  auctionId: 10, name: "Auction 10", status: AuctionStatusEnum.Ongoing, image: "image10.jpg", description: "Brief details about Auction 10",
  topBid: 1.25,
  numberOfBids: 3,
  endDate: new Date('2023-12-10T22:00:00Z')
}
];

const numAuctions = auctionsDB.length;

const YourListings: React.FC<YourListingsProps> = ({ user }) => {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [auctions, setAuctions] = useState<Auction[]>([]);

  const handleStatusChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedStatuses(event.target.value as string[]);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    //TODO: initial fetch for pages
    setAuctions(auctionsDB.slice(0, cardPerPage));
  }, [])

  const totalPages = Math.ceil(numAuctions / cardPerPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page:  number): void => {
    setCurrentPage(page);
        //TODO: fetch data for new page
    setAuctions(auctionsDB.slice((page - 1) * cardPerPage, page * cardPerPage));

  };

  //TODO: andre countdown timer
  return (
    <Container sx={{ mt: 1, width: '100vw', maxWidth: '1600px !important'}}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0}>
        <Typography variant="h4" component="h1" gutterBottom>
          Your Listings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Page {currentPage} / {totalPages}
        </Typography>
      </Box>

      <FormControl fullWidth margin="normal">
        <InputLabel>Auction Status</InputLabel>
        <Select
          multiple
          value={selectedStatuses}
          onChange={handleStatusChange}
          input={<OutlinedInput label="Auction Status" />}
          renderValue={(selected) => (selected as string[]).join(', ')}
        >
          {auctionStatuses.map((status) => (
            <MenuItem key={status} value={status}>
              <Checkbox checked={selectedStatuses.indexOf(status) > -1} />
              <ListItemText primary={status} />
            </MenuItem>
          ))}
        </Select>
    </FormControl>
    
    <TextField
      label="Search by Auction Name"
      fullWidth
      margin="normal"
      value={searchTerm}
      onChange={handleSearchChange}
      sx={{ mt: 1, mb: 2 }}
    />

      <ListingsGallery auctions={auctions} />

      <Box display="flex" justifyContent="center" marginTop={2} marginBottom={2}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Container>
  );
};

export default YourListings;