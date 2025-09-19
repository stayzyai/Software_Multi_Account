import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { getConversationsWithResources, getHostawayReservation } from '../helpers/Message';
import { getHostawayTask } from '../helpers/TaskHelper';
import { setConversations } from '../store/conversationSlice';
import { setReservations } from '../store/reservationSlice';
import { setTasks } from '../store/taskSlice';

/**
 * Comprehensive polling hook that handles all data types
 */
export const useDataPolling = () => {
  const dispatch = useDispatch();

  const pollAllData = useCallback(async () => {
    try {
      console.log('🔄 Polling all data...');
      
      // Poll conversations
      const conversations = await getConversationsWithResources();
      dispatch(setConversations(conversations));
      console.log('✅ Conversations updated');
      
      // Poll reservations
      const reservations = await getHostawayReservation();
      dispatch(setReservations(reservations));
      console.log('✅ Reservations updated');
      
      // Poll tasks
      const tasks = await getHostawayTask();
      dispatch(setTasks(tasks));
      console.log('✅ Tasks updated');
      
      console.log('🎉 All data polling completed successfully');
      return { conversations, reservations, tasks };
    } catch (error) {
      console.error('❌ Error during data polling:', error);
      throw error;
    }
  }, [dispatch]);

  const pollConversations = useCallback(async () => {
    try {
      console.log('🔄 Polling conversations...');
      const data = await getConversationsWithResources();
      dispatch(setConversations(data));
      console.log('✅ Conversations updated');
      return data;
    } catch (error) {
      console.error('❌ Error polling conversations:', error);
      throw error;
    }
  }, [dispatch]);

  const pollReservations = useCallback(async () => {
    try {
      console.log('🔄 Polling reservations...');
      const data = await getHostawayReservation();
      dispatch(setReservations(data));
      console.log('✅ Reservations updated');
      return data;
    } catch (error) {
      console.error('❌ Error polling reservations:', error);
      throw error;
    }
  }, [dispatch]);

  const pollTasks = useCallback(async () => {
    try {
      console.log('🔄 Polling tasks...');
      const data = await getHostawayTask();
      dispatch(setTasks(data));
      console.log('✅ Tasks updated');
      return data;
    } catch (error) {
      console.error('❌ Error polling tasks:', error);
      throw error;
    }
  }, [dispatch]);

  return {
    pollAllData,
    pollConversations,
    pollReservations,
    pollTasks
  };
};
