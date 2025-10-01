import { Apps, ArrowBack, PhoneAndroid, Refresh } from "@mui/icons-material";
import { Button, InputAdornment, Paper, TextField } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { StatusCodes } from "http-status-codes";
import { useContext, useEffect, useReducer } from "react";
import { useNavigate } from "react-router";
import { API_ENDPOINTS } from "../../constants/GlobalConstants";
import { GlobalContext } from "../GlobalContextProvider";
import "./Login.css";

const defaultState = {
  loginPhoneNumber: "",
  incorrectLengthPhoneNumber: true,
  invalidCharactersPhoneNumber: false,
  phoneNumberNotRegistered: false,
  otpGenerationError: false,
  wrongOtp: false,
  invalidCharactersOtp: false,
  otp: "",
  otpRequested: false,
  validateOtpRequested: false,
  validateOtpSuccess: false,
  validateOtpFailure: false,
  counterToResendOtp: 0,
  invalidJwtToken: false,
};

const OTP_COUNTER = 10;

const actionTypes = {
  SET_LOGIN_PHONE_NUMBER: "SET_LOGIN_PHONE_NUMBER",
  PHONE_NUMBER_NOT_REGISTERED: "PHONE_NUMBER_NOT_REGISTERED",
  OTP_GENERATION_ERROR: "OTP_GENERATION_ERROR",
  OTP_REQUESTED: "OTP_REQUESTED",
  BACK_TO_PHONE_NUMBER: "BACK_TO_PHONE_NUMBER",
  SET_OTP: "SET_OTP",
  VALIDATE_OTP: "VALIDATE_OTP",
  VALIDATE_OTP_SUCCESS: "VALIDATE_OTP_SUCCESS",
  VALIDATE_OTP_FAILURE: "VALIDATE_OTP_FAILURE",
  DECREMENT_COUNTDOWN: "DECREMENT_COUNTDOWN",
  WRONG_OTP: "WRONG_OTP",
  INVALID_JWT_TOKEN: "INVALID_JWT_TOKEN",
};

const reducer = (state: any, action: any) => {
  switch (action.type) {
    case actionTypes.SET_LOGIN_PHONE_NUMBER:
      return {
        ...state,
        loginPhoneNumber: action.payload,
        incorrectLengthPhoneNumber: action.payload.length !== 10,
        invalidCharactersPhoneNumber:
          action.payload === "" ? false : !/^[0-9]+$/.test(action.payload),
        phoneNumberNotRegistered: false, // Clear error when user types
        otpGenerationError: false, // Clear error when user types
      };
    case actionTypes.PHONE_NUMBER_NOT_REGISTERED:
      return {
        ...state,
        phoneNumberNotRegistered: true,
      };
    case actionTypes.OTP_GENERATION_ERROR:
      return {
        ...state,
        otpGenerationError: true,
      };
    case actionTypes.OTP_REQUESTED:
      return {
        ...state,
        otpRequested: true,
        otp: "",
        validateOtpRequested: false,
        counterToResendOtp: OTP_COUNTER,
      };
    case actionTypes.BACK_TO_PHONE_NUMBER:
      return {
        ...state,
        otpRequested: false,
        otp: "",
        validateOtpRequested: false,
        wrongOtp: false,
      };
    case actionTypes.SET_OTP:
      return {
        ...state,
        otp: action.payload,
        invalidCharactersOtp:
          action.payload === "" ? false : !/^[0-9]+$/.test(action.payload),
      };
    case actionTypes.VALIDATE_OTP:
      return {
        ...state,
        validateOtpRequested: true,
        otpRequested: false,
        counterToResendOtp: 0,
      };

    case actionTypes.VALIDATE_OTP_SUCCESS:
      return { ...state, validateOtpRequested: false };
    case actionTypes.WRONG_OTP:
      return { ...state, wrongOtp: true };
    case actionTypes.VALIDATE_OTP_FAILURE:
      return { ...state, validateOtpRequested: false };
    case actionTypes.DECREMENT_COUNTDOWN:
      return { ...state, counterToResendOtp: state.counterToResendOtp - 1 };
    case actionTypes.INVALID_JWT_TOKEN:
      return { ...state, invalidJwtToken: true };
  }
};

function Login({ appName }: { appName: string }) {
  const { jwtToken, setJwtToken, isTokenValid } = useContext(GlobalContext);
  const [state, dispatch] = useReducer(reducer, defaultState);
  const navigate = useNavigate();

  // Navigate to home when token becomes valid
  useEffect(() => {
    if (jwtToken && isTokenValid) {
      navigateToHome();
    }
  }, [jwtToken, isTokenValid]);
  useEffect(() => {
    if (state.otpRequested) {
      const interval = setInterval(() => {
        if (
          state.counterToResendOtp > 0 &&
          state.otpRequested &&
          !state.validateOtpRequested
        ) {
          dispatch({ type: actionTypes.DECREMENT_COUNTDOWN });
        }
      }, 1000);
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [state.otpRequested, state.counterToResendOtp]);

  const generateOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(API_ENDPOINTS.GENERATE_OTP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile: state.loginPhoneNumber }),
      });

      if (response.status !== StatusCodes.OK) {
        // Create error with status code for proper handling
        const error = new Error(`HTTP ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      return response; // Return the response object instead of parsed JSON
    },
    onSuccess: async () => {
      dispatch({ type: actionTypes.OTP_REQUESTED });
    },
    onError: (error) => {
      if ((error as any).status === StatusCodes.BAD_REQUEST) {
        dispatch({ type: actionTypes.PHONE_NUMBER_NOT_REGISTERED });
      } else {
        dispatch({ type: actionTypes.OTP_GENERATION_ERROR });
      }
    },
  });
  const handleGetOtpButtonClick = () => {
    generateOtpMutation.mutate();
  };

  const validateOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(API_ENDPOINTS.VALIDATE_OTP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile: state.loginPhoneNumber,
          otp: state.otp,
        }),
      });

      if (response.status !== StatusCodes.OK) {
        // Create error with status code for proper handling
        const error = new Error(`HTTP ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      return response; // Return the response object instead of parsed JSON
    },
    onSuccess: async (response) => {
      const data = await response.json();

      setJwtToken(data.access_token);
      // Navigation will be handled by useEffect when token becomes valid
    },
    onError: (error) => {
      if ((error as any).status === StatusCodes.UNAUTHORIZED) {
        dispatch({ type: actionTypes.WRONG_OTP });
      } else {
        dispatch({ type: actionTypes.VALIDATE_OTP_FAILURE });
      }
    },
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // Remove non-digits
    dispatch({
      type: actionTypes.SET_LOGIN_PHONE_NUMBER,
      payload: value,
    });
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Prevent default form submission
      e.preventDefault();

      // Only trigger if phone number is valid and not already loading
      if (
        !state.incorrectLengthPhoneNumber &&
        !state.invalidCharactersPhoneNumber &&
        !generateOtpMutation.isPending
      ) {
        handleGetOtpButtonClick();
      }
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // Remove non-digits
    if (value.length === 6) {
      validateOtpMutation.mutate();
    } else {
      dispatch({
        type: actionTypes.SET_OTP,
        payload: value,
      });
    }
  };

  const navigateToHome = () => {
    navigate("/");
  };

  return (
    <>
      <div className="login-component-outer-container">
        <Paper elevation={5} className="login-component-container">
          {!state.otpRequested && !state.validateOtpRequested && (
            <>
              <div className="paper-title">Login to {appName}</div>
              <div>
                <TextField
                  fullWidth
                  autoFocus
                  autoComplete="off"
                  size="medium"
                  type="tel"
                  error={
                    state.invalidCharactersPhoneNumber ||
                    state.phoneNumberNotRegistered ||
                    state.otpGenerationError
                  }
                  value={state.loginPhoneNumber}
                  id="outlined-error"
                  label="Mobile Number"
                  placeholder="10 digits"
                  helperText={
                    state.invalidCharactersPhoneNumber
                      ? "Only digits are allowed"
                      : state.phoneNumberNotRegistered
                      ? "Mobile number not registered"
                      : state.otpGenerationError
                      ? "Failed to generate OTP"
                      : " "
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneAndroid />
                        </InputAdornment>
                      ),
                    },
                    htmlInput: {
                      maxLength: 10,
                    },
                  }}
                  onChange={handlePhoneChange}
                  onKeyDown={handlePhoneKeyDown}
                />
              </div>
              <div>
                <Button
                  fullWidth
                  size="large"
                  onClick={handleGetOtpButtonClick}
                  loading={generateOtpMutation.isPending}
                  loadingPosition="end"
                  variant="contained"
                  disabled={
                    state.incorrectLengthPhoneNumber ||
                    state.invalidCharactersPhoneNumber ||
                    generateOtpMutation.isPending
                  }
                >
                  Get OTP
                </Button>
              </div>
            </>
          )}
          {(state.otpRequested || state.validateOtpRequested) && (
            <>
              <div className="paper-title">
                Verify OTP sent to {state.loginPhoneNumber}
              </div>
              <div>
                <TextField
                  autoFocus
                  fullWidth
                  autoComplete="off"
                  size="medium"
                  type="tel"
                  error={
                    state.invalidCharactersOtp ||
                    state.wrongOtp ||
                    state.validateOtpFailure ||
                    state.invalidJwtToken
                  }
                  value={state.otp}
                  id="outlined-error"
                  label="OTP"
                  placeholder="6 digits"
                  helperText={
                    state.invalidCharactersOtp
                      ? "Digits Only"
                      : state.wrongOtp
                      ? "Wrong OTP Entered"
                      : state.validateOtpFailure
                      ? "Failed to validate OTP."
                      : state.invalidJwtToken
                      ? "Invalid Authentication Token"
                      : " "
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Apps />
                        </InputAdornment>
                      ),
                    },
                    htmlInput: {
                      maxLength: 6,
                    },
                  }}
                  onChange={handleOtpChange}
                />
              </div>
              <div className="otp-button-group-container">
                <Button
                  size="large"
                  onClick={() =>
                    dispatch({ type: actionTypes.BACK_TO_PHONE_NUMBER })
                  }
                  variant="contained"
                  startIcon={<ArrowBack />}
                >
                  Back
                </Button>
                <Button
                  size="large"
                  onClick={handleGetOtpButtonClick}
                  variant="contained"
                  disabled={state.counterToResendOtp > 0}
                  startIcon={<Refresh />}
                >
                  Resend OTP
                </Button>
              </div>
              <div className="otp-countdown-text-container">
                {state.otpRequested && state.counterToResendOtp > 0 ? (
                  <span className="otp-countdown-text">
                    Resend OTP in {state.counterToResendOtp} seconds
                  </span>
                ) : (
                  <div>&nbsp;</div>
                )}
              </div>
            </>
          )}
        </Paper>
      </div>
    </>
  );
}

export default Login;
