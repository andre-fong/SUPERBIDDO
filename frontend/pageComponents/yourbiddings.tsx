import React, { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  SelectChangeEvent,
  Pagination,
} from "@mui/material";
import { User } from "@/types/userTypes";
import {
  BiddingStatus,
  BiddingStatusEnum,
} from "@/types/auctionTypes";
import ListingsGallery from "@/components/listingsGallery";
import useSelfAuctions from "@/hooks/useSelfAuctions";
import { ErrorType } from "@/types/errorTypes";
import { PageName } from "@/types/pageTypes";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";

interface YourBiddingsProps {
  user: User;
  setToast: (error: ErrorType) => void;
  setCurPage: (page: PageName, context?: string) => void;
  context: string;
}

const auctionStatuses: BiddingStatus[] = Object.values(BiddingStatusEnum).map(
  (status) => status.toString() as BiddingStatus
);

const cardsPerPage = 9;

const YourBiddings: React.FC<YourBiddingsProps> = ({
  user,
  setToast,
  setCurPage,
  context,
}) => {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Set status provided in context if exists
  useEffect(() => {
    if (context) {
      const status = JSON.parse(context)?.filter;
      if (auctionStatuses.includes(status as BiddingStatus)) {
        setTimeout(() => {
          setSelectedStatuses([status]);
        }, 500);
      }
    }
  }, [context]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { auctions, totalPages, isLoaded } = useSelfAuctions(
    "biddings",
    setToast,
    user,
    searchTerm,
    selectedStatuses,
    currentPage,
    cardsPerPage,
    setCurrentPage
  );


  const handleStatusChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedStatuses(event.target.value as string[]);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ): void => {
    setCurrentPage(page);
  };

  return (
    <>
      <div
        role="presentation"
        onClick={(e) => e.preventDefault()}
        style={{ marginLeft: "30px", marginBottom: "20px" }}
      >
        <Breadcrumbs aria-label="breadcrumb" sx={{ marginBottom: "15px" }}>
          <Link
            underline="hover"
            color="inherit"
            href="/"
            onClick={() => setCurPage("home")}
          >
            Home
          </Link>
          <p style={{ color: "black" }}>Bid History</p>
        </Breadcrumbs>
      </div>

      <Container sx={{ mt: 1, width: "100vw", maxWidth: "1600px !important" }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={0}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Your Bid History
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Page {totalPages === 0 ? 0 : currentPage} / {totalPages}
          </Typography>
        </Box>

        <FormControl fullWidth margin="normal">
          <InputLabel>Bidding Status</InputLabel>
          <Select
            multiple
            value={selectedStatuses}
            onChange={handleStatusChange}
            input={<OutlinedInput label="Bidding Status" />}
            renderValue={(selected) => (selected as string[]).join(", ")}
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

        <ListingsGallery auctions={auctions} setCurPage={setCurPage} isLoaded={isLoaded} />
        {totalPages === 0 && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontStyle: "italic", textAlign: "center", mt: 2 }}
          >
            No Auctions Found
          </Typography>
        )}

        <Box
          display="flex"
          justifyContent="center"
          marginTop={2}
          marginBottom={2}
        >
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      </Container>
    </>
  );
};

export default YourBiddings;
