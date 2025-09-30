import { useContext, useEffect, useReducer } from "react";
import { useMutation } from "@tanstack/react-query";
import { StatusCodes } from "http-status-codes";
import { GlobalContext } from "../GlobalContextProvider";
import { useNavigate } from "react-router";
import { API_ENDPOINTS } from "../../constants/GlobalConstants";

const defaultState = {
  loginPhoneNumber: "",
  incorrectLengthPhoneNumber: true,
  invalidCharactersPhoneNumber: false,
  phoneNumberNotRegistered: false,
  otpGenerationError: false,
  wrongOtp: false,
  incorrectLengthOtp: true,
  invalidCharactersOtp: false,
  otp: "",
  otpRequested: false,
  validateOtpRequested: false,
  validateOtpSuccess: false,
  validateOtpFailure: false,
  counterToResendOtp: 0,
  invalidJwtToken: false,
};

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
        counterToResendOtp: 10,
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
        incorrectLengthOtp: action.payload.length !== 6,
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

function Login() {
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
      if ((error as any).status === StatusCodes.BAD_REQUEST) {
        dispatch({ type: actionTypes.WRONG_OTP });
      } else {
        dispatch({ type: actionTypes.VALIDATE_OTP_FAILURE });
      }
    },
  });
  const handleValidateOtpButtonClick = () => {
    validateOtpMutation.mutate();
  };

  const navigateToHome = () => {
    navigate("/");
  };

  return (
    <>
      <h1>Login </h1>

      {!state.otpRequested && !state.validateOtpRequested && (
        <>
          {state.invalidCharactersPhoneNumber && <p>Only digits are allowed</p>}
          {state.otpGenerationError && <p>Failed to generate OTP</p>}
          {state.phoneNumberNotRegistered && <p>Phone number not registered</p>}
          <input
            type="text"
            maxLength={10}
            value={state.loginPhoneNumber}
            onChange={(e) =>
              dispatch({
                type: actionTypes.SET_LOGIN_PHONE_NUMBER,
                payload: e.target.value,
              })
            }
          />
          <button
            onClick={handleGetOtpButtonClick}
            disabled={
              state.incorrectLengthPhoneNumber ||
              state.invalidCharactersPhoneNumber ||
              generateOtpMutation.isPending
            }
          >
            {generateOtpMutation.isPending ? "Sending..." : "Get OTP"}
          </button>
        </>
      )}
      {(state.otpRequested || state.validateOtpRequested) && (
        <>
          {state.invalidCharactersOtp && <p>Invalid characters</p>}
          {state.wrongOtp && <p>Wrong OTP</p>}
          {state.validateOtpFailure && <p>Failed to validate OTP</p>}
          {state.invalidJwtToken && <p>Invalid JWT token</p>}
          <input
            type="text"
            value={state.otp}
            maxLength={6}
            onChange={(e) =>
              dispatch({ type: actionTypes.SET_OTP, payload: e.target.value })
            }
          />
          <button
            onClick={() => dispatch({ type: actionTypes.BACK_TO_PHONE_NUMBER })}
          >
            Back
          </button>
          <button
            onClick={handleValidateOtpButtonClick}
            disabled={state.incorrectLengthOtp || state.invalidCharactersOtp}
          >
            Validate OTP
          </button>
          {state.otpRequested && state.counterToResendOtp > 0 && (
            <p>Resend OTP in {state.counterToResendOtp} seconds</p>
          )}
        </>
      )}
    </>
  );
}

export default Login;
