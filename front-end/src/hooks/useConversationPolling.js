import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { getConversationsWithResources } from '../helpers/Message';
import { setConversations } from '../store/conversationSlice';
import { getHostawayReservation } from '../helpers/Message';
import { setReservations } from '../store/reservationSlice';
import { getHostawayTask } from '../helpers/TaskHelper';
import { setTasks } from '../store/taskSlice';

/**
 * Custom hook for polling conversation data
 */
export const useConversationPolling = () => {
  const dispatch = useDispatch();

  const pollConversations = useCallback(async () => {
    try {
      console.log('Polling conversations...');
      const data = await getConversationsWithResources();
      dispatch(setConversations(data));
      console.log('Conversations updated via polling');
      return data;
    } catch (error) {
      console.error('Error polling conversations:', error);
      throw error;
    }
  }, [dispatch]);

  return pollConversations;
};

/**
 * Custom hook for polling reservation data
 */
export const useReservationPolling = () => {
  const dispatch = useDispatch();

  const pollReservations = useCallback(async () => {
    try {
      console.log('Polling reservations...');
      const data = await getHostawayReservation();
      dispatch(setReservations(data));
      console.log('Reservations updated via polling');
      return data;
    } catch (error) {
      console.error('Error polling reservations:', error);
      throw error;
    }
  }, [dispatch]);

  return pollReservations;
};

/**
 * Custom hook for polling task data
 */
export const useTaskPolling = () => {
  const dispatch = useDispatch();

  const pollTasks = useCallback(async () => {
    try {
      console.log('Polling tasks...');
      const data = await getHostawayTask();
      dispatch(setTasks(data));
      console.log('Tasks updated via polling');
      return data;
    } catch (error) {
      console.error('Error polling tasks:', error);
      throw error;
    }
  }, [dispatch]);

  return pollTasks;
};
