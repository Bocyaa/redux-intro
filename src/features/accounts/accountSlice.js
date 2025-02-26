import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
  balance: 0,
  loan: 0,
  loanPurpose: '',
  isLoading: false,
};

export const deposit = createAsyncThunk(
  'account/deposit',
  async ({ amount, currency }, { rejectWithValue }) => {
    if (currency === 'USD') return amount;

    try {
      const res = await fetch(
        `https://api.frankfurter.dev/v1/latest?amount=${amount}&from=${currency}&to=USD`
      );
      const data = await res.json();
      return data.rates.USD; // This becomes the payload
    } catch {
      return rejectWithValue('Failed to convert currency');
    }
  }
);

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    withdraw(state, action) {
      state.balance -= action.payload;
    },
    requestLoan: {
      prepare(amount, purpose) {
        return {
          payload: { amount, purpose },
        };
      },

      reducer(state, action) {
        if (state.loan > 0) return;

        state.loan = action.payload.amount;
        state.loanPurpose = action.payload.purpose;
        state.balance += action.payload.amount;
      },
    },
    payLoan(state) {
      state.balance -= state.loan;
      state.loan = 0;
      state.loanPurpose = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deposit.pending, (state) => {
        console.log('Deposit action pending...');
        state.isLoading = true;
      })
      .addCase(deposit.fulfilled, (state, action) => {
        console.log('Deposit successful:', action.payload);
        state.balance += action.payload;
        state.isLoading = false;
      })
      .addCase(deposit.rejected, (state, action) => {
        console.log('Deposit failed:', action.error);
        state.isLoading = false;
      });
  },
});

export const { withdraw, requestLoan, payLoan } = accountSlice.actions;

export default accountSlice.reducer;
