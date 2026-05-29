import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, User } from '../types/index';
import { CONFIG } from '../config';
import { useAuth } from '../contexts/AuthContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Grid,
  GridItem,
  Card,
  CardBody,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useColorModeValue,
  IconButton,
  Flex,
  useToast,
  Spinner,
  Center,
  Divider,
  ModalFooter,
  Fade,
  ScaleFade,
  SlideFade,
  Collapse,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  AddIcon,
  DeleteIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons';
import { FaUser, FaCalendar } from 'react-icons/fa';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';

const MotionBox = motion(Box)

interface KanbanProps {
  onNavigate: (page: string) => void;
}

// Portuguese translations
const translations = {
  title: 'Tarefas',
  subtitle: 'Gerir tarefas e acompanhar progresso',
  newTask: 'Novo',
  todo: 'Por Fazer',
  inProgress: 'Em Progresso',
  done: 'Concluído',
  priority: {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente'
  },
  form: {
    title: 'Criar Novo',
    titleLabel: 'Título *',
    titlePlaceholder: 'Título da tarefa',
    descriptionLabel: 'Descrição *',
    descriptionPlaceholder: 'Descrição da tarefa',
    priorityLabel: 'Prioridade',
    assignLabel: 'Atribuir a (opcional)',
    assignPlaceholder: 'Selecionar utilizador',
    dueDateLabel: 'Data Limite (opcional)',
    cancel: 'Cancelar',
    create: 'Criar Tarefa',
    delete: 'Eliminar',
    start: 'Iniciar',
    complete: 'Concluir'
  },
  messages: {
    noTasks: 'Nenhuma tarefa encontrada.',
    assignedTo: 'Atribuída a:',
    dueDate: 'Data limite:',
    createdBy: 'Criada por',
    fraction: 'Fração',
    confirmDelete: 'Tem a certeza que pretende eliminar esta tarefa?',
    taskCreated: 'Tarefa criada com sucesso!',
    taskUpdated: 'Tarefa atualizada com sucesso!',
    taskDeleted: 'Tarefa eliminada com sucesso!',
    error: 'Ocorreu um erro. Tente novamente.'
  }
};

// Sortable Task Card Component
function SortableTaskCard({ task, users, onDelete, onStatusChange, currentUser, deletingTaskId }: {
  task: Task;
  users: User[];
  onDelete: (task: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  currentUser: any;
  deletingTaskId: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const isMobile = useBreakpointValue({ base: true, md: false });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const textColorSecondary = useColorModeValue('gray.600', 'gray.300');
  const textColorMuted = useColorModeValue('gray.500', 'gray.400');
  const priorityColors = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    urgent: 'red'
  };

  const priorityLabels = translations.priority;

  const getUserName = (email: string) => {
    if (!email) return 'Ninguém';
    const user = users.find(u => u.email === email);
    return user?.name || email.split('@')[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  const canDelete = currentUser?.email === task.created_by || currentUser?.is_admin;
  const canUpdate = currentUser?.email === task.created_by || currentUser?.email === task.assigned_to || currentUser?.is_admin;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete button clicked for task:', task.id);
    onDelete(task);
  };

  const handleMoveTask = (direction: 'left' | 'right') => {
    const currentStatus = task.status;
    let newStatus: Task['status'];

    if (direction === 'left') {
      switch (currentStatus) {
        case 'done':
          newStatus = 'in_progress';
          break;
        case 'in_progress':
          newStatus = 'todo';
          break;
        default:
          return; // Already at the leftmost
      }
    } else {
      switch (currentStatus) {
        case 'todo':
          newStatus = 'in_progress';
          break;
        case 'in_progress':
          newStatus = 'done';
          break;
        default:
          return; // Already at the rightmost
      }
    }

    onStatusChange(task.id, newStatus);
  };

  const canMoveLeft = task.status !== 'todo' && canUpdate;
  const canMoveRight = task.status !== 'done' && canUpdate;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      shadow="sm"
      _hover={{ shadow: 'lg', borderColor: `${priorityColors[task.priority]}.300` }}
      transition="all 0.2s"
      cursor={canUpdate ? "grab" : "default"}
      _active={{ cursor: canUpdate ? "grabbing" : "default" }}
      mb={4}
      borderRadius="lg"
    >
      <CardBody p={5}>
        <Flex justify="space-between" align="flex-start" mb={4}>
          <Box
            {...(canUpdate ? attributes : {})}
            {...(canUpdate ? listeners : {})}
            cursor={canUpdate ? "grab" : "default"}
            _active={{ cursor: canUpdate ? "grabbing" : "default" }}
            flex={1}
            mr={3}
          >
            <Heading size="sm" color={textColor} lineHeight="tight" fontWeight="semibold">
              {task.title}
            </Heading>
            <Text fontSize="sm" color={textColorSecondary} mt={2} noOfLines={2}>{task.description}</Text>
          </Box>
          <HStack spacing={2}>
            {/* Move Left/Up Button */}
            {canMoveLeft && (
              <IconButton
                aria-label={isMobile ? "Mover para cima" : "Mover para esquerda"}
                icon={isMobile ? <ChevronUpIcon /> : <ChevronLeftIcon />}
                size="sm"
                colorScheme="blue"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMoveTask('left');
                }}
                _hover={{ bg: 'blue.50' }}
              />
            )}
            
            {/* Move Right/Down Button */}
            {canMoveRight && (
              <IconButton
                aria-label={isMobile ? "Mover para baixo" : "Mover para direita"}
                icon={isMobile ? <ChevronDownIcon /> : <ChevronRightIcon />}
                size="sm"
                colorScheme="blue"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMoveTask('right');
                }}
                _hover={{ bg: 'blue.50' }}
              />
            )}

            {/* Delete Button */}
            {canDelete && (
              <IconButton
                aria-label="Eliminar tarefa"
                icon={deletingTaskId === task.id ? <Spinner size="sm" /> : <DeleteIcon />}
                size="sm"
                colorScheme="red"
                variant="solid"
                onClick={handleDelete}
                isLoading={deletingTaskId === task.id}
                isDisabled={deletingTaskId === task.id}
                _hover={{ bg: 'red.600' }}
                _active={{ bg: 'red.700' }}
              />
            )}
          </HStack>
        </Flex>
        <Divider my={3} />
        <Flex justify="space-between" align="center">
          <HStack spacing={2} color={textColorSecondary} fontSize="sm">
            <FaUser />
            <Text>{getUserName(task.assigned_to || '')}</Text>
          </HStack>
          <Badge colorScheme={priorityColors[task.priority]} variant="subtle">
            {priorityLabels[task.priority]}
          </Badge>
        </Flex>
        {task.due_date && (
          <HStack spacing={2} color={textColorSecondary} fontSize="sm" mt={2}>
            <FaCalendar />
            <Text>{formatDate(task.due_date)}</Text>
          </HStack>
        )}
      </CardBody>
    </Card>
  );
}

// Sortable Column Component
function SortableColumn({ 
  id, 
  title, 
  tasks, 
  users, 
  onDelete, 
  onStatusChange, 
  currentUser,
  bgColor,
  deletingTaskId
}: {
  id: string;
  title: string;
  tasks: Task[];
  users: User[];
  onDelete: (task: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  currentUser: any;
  bgColor: string;
  deletingTaskId: string | null;
}) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  const textColor = useColorModeValue('gray.800', 'white');
  const textColorSecondary = useColorModeValue('gray.600', 'gray.300');
  const textColorMuted = useColorModeValue('gray.500', 'gray.400');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const badgeBg = useColorModeValue('white', 'gray.700');
  const badgeColor = useColorModeValue('gray.700', 'gray.300');

  return (
    <Box 
      ref={setNodeRef}
      bg={bgColor} 
      borderRadius="lg" 
      p={6} 
      minH="600px"
      data-column-id={id}
      borderWidth="1px"
      borderColor={cardBorderColor}
      _hover={{ boxShadow: 'md' }}
      transition="all 0.2s"
    >
      <Flex align="center" justify="space-between" mb={6}>
        <Heading size="md" color={textColor} fontWeight="semibold">
          {title}
        </Heading>
        <Badge
          bg={badgeBg}
          color={badgeColor}
          px={3}
          py={1}
          borderRadius="full"
          fontSize="sm"
          fontWeight="medium"
          boxShadow="sm"
        >
          {tasks.length}
        </Badge>
      </Flex>
      
      <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
        <VStack spacing={3} align="stretch">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              users={users}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              currentUser={currentUser}
              deletingTaskId={deletingTaskId}
            />
          ))}
        </VStack>
      </SortableContext>
      
      {tasks.length === 0 && (
        <Center py={8}>
          <Text color={textColorMuted} fontSize="sm">
            {translations.messages.noTasks}
          </Text>
        </Center>
      )}
    </Box>
  );
}

const Kanban: React.FC<KanbanProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assigned_to: '',
    due_date: ''
  });

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const textColorSecondary = useColorModeValue('gray.600', 'gray.300');
  const textColorMuted = useColorModeValue('gray.500', 'gray.400');
  const cardBgWhite = useColorModeValue('white', 'gray.800');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const badgeBg = useColorModeValue('white', 'gray.700');
  const badgeColor = useColorModeValue('gray.700', 'gray.300');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = [
    { id: 'todo', title: translations.todo, bgColor: cardBg },
    { id: 'in_progress', title: translations.inProgress, bgColor: cardBg },
    { id: 'done', title: translations.done, bgColor: cardBg }
  ];

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Erro',
        description: translations.messages.error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('email');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const createTask = async () => {
    if (!user || !newTask.title || !newTask.description) return;

    try {
      const { data: newTaskData, error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          assigned_to: newTask.assigned_to || null,
          created_by: user.email,
          fraction: user.fraction,
          due_date: newTask.due_date || null
        })
        .select()
        .single();

      if (error) throw error;

      console.log('New task created:', newTaskData);

      // Add the new task to the state immediately
      setTasks(prevTasks => [newTaskData, ...prevTasks]);

      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        due_date: ''
      });
      setShowCreateModal(false);
      
      toast({
        title: 'Sucesso',
        description: translations.messages.taskCreated,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Erro',
        description: translations.messages.error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      console.log('Task status updated:', updatedTask);

      // Update the task in state immediately
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      toast({
        title: 'Sucesso',
        description: translations.messages.taskUpdated,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Erro',
        description: translations.messages.error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    console.log('Delete task called with ID:', taskId);
    console.log('Current user:', user);
    console.log('Current tasks in state:', tasks);
    
    if (deletingTaskId) {
      console.log('Delete already in progress, ignoring');
      return;
    }

    try {
      setDeletingTaskId(taskId);
      console.log('Attempting to delete task from database...');
      
      // First, let's check if the task exists and get its details
      const { data: taskData, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (fetchError) {
        console.error('Error fetching task details:', fetchError);
        throw new Error('Task not found');
      }

      console.log('Task to delete:', taskData);
      console.log('Task created by:', taskData.created_by);
      console.log('Current user email:', user?.email);
      console.log('Is admin:', user?.is_admin);
      console.log('Can delete:', user?.email === taskData.created_by || user?.is_admin);

      if (user?.email !== taskData.created_by && !user?.is_admin) {
        throw new Error('You can only delete tasks you created');
      }

      // Optimistically update the UI first
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Database error:', error);
        // Revert the optimistic update if the delete failed
        await fetchTasks();
        throw error;
      }
      
      console.log('Task deleted successfully from database');
      
      toast({
        title: 'Sucesso',
        description: translations.messages.taskDeleted,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : translations.messages.error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeletingTaskId(null);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  };

  const handleDeleteClick = (task: Task) => {
    console.log('handleDeleteClick called for task:', task.id);
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    console.log('confirmDelete called for task:', taskToDelete?.id);
    if (taskToDelete) {
      deleteTask(taskToDelete.id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('Drag end event:', { active, over });

    if (active.id !== over?.id) {
      const activeTask = tasks.find(task => task.id === active.id);
      const overColumn = over?.id as string;
      
      console.log('Drag end:', { activeId: active.id, overId: over?.id, overColumn, activeTask });
      
      // Check if we're dropping on a column
      if (activeTask && overColumn && ['todo', 'in_progress', 'done'].includes(overColumn)) {
        // Check if user has permission to update this task
        const canUpdate = user?.email === activeTask.created_by || 
                         user?.email === activeTask.assigned_to || 
                         user?.is_admin;
        
        if (!canUpdate) {
          console.log('User does not have permission to update this task');
          toast({
            title: 'Permissão negada',
            description: 'Só pode mover tarefas que criou, está atribuído, ou se for administrador.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        
        const newStatus = overColumn as Task['status'];
        console.log('Updating task status:', { taskId: activeTask.id, newStatus });
        updateTaskStatus(activeTask.id, newStatus);
      } else {
        console.log('Invalid drop target or task not found');
      }
    } else {
      console.log('Dropped on same item, ignoring');
    }
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={bgColor} p={6}>
        <Container maxW="container.xl">
          <Center minH="400px">
            <Spinner size="xl" />
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={8} pb={32}>
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        mb={8}
      >
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <Heading size="2xl" color={textColor} mb={2}>
              📋 {translations.title}
            </Heading>
            <Text fontSize="lg" color={textColorSecondary}>
              {translations.subtitle}
            </Text>
          </Box>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            size={{ base: "md", md: "lg" }}
            onClick={() => setShowCreateModal(true)}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s"
          >
            {translations.newTask}
          </Button>
        </Flex>
      </MotionBox>

      {/* Kanban Board */}
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
            {columns.map(column => (
              <GridItem key={column.id}>
                <SortableColumn
                  id={column.id}
                  title={column.title}
                  tasks={getTasksByStatus(column.id as Task['status'])}
                  users={users}
                  onDelete={handleDeleteClick}
                  onStatusChange={updateTaskStatus}
                  currentUser={user}
                  bgColor={column.bgColor}
                  deletingTaskId={deletingTaskId}
                />
              </GridItem>
            ))}
          </Grid>
        </DndContext>
      </MotionBox>

      {/* Create Task Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{translations.form.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6}>
              <FormControl isRequired>
                <FormLabel fontWeight="semibold">
                  {translations.form.titleLabel}
                </FormLabel>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder={translations.form.titlePlaceholder}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="semibold">
                  {translations.form.descriptionLabel}
                </FormLabel>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder={translations.form.descriptionPlaceholder}
                  rows={4}
                  resize="none"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="semibold">
                  {translations.form.priorityLabel}
                </FormLabel>
                <Select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                >
                  <option value="low">{translations.priority.low}</option>
                  <option value="medium">{translations.priority.medium}</option>
                  <option value="high">{translations.priority.high}</option>
                  <option value="urgent">{translations.priority.urgent}</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="semibold">
                  {translations.form.assignLabel}
                </FormLabel>
                <Select
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                >
                  <option value="">{translations.form.assignPlaceholder}</option>
                  {users.map(user => (
                    <option key={user.email} value={user.email}>
                      {user.email} ({user.fraction})
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="semibold">
                  {translations.form.dueDateLabel}
                </FormLabel>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </FormControl>
            </VStack>

            <HStack spacing={4} mt={8}>
              <Button
                flex={1}
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                {translations.form.cancel}
              </Button>
              <Button
                flex={1}
                colorScheme="blue"
                onClick={createTask}
                isDisabled={!newTask.title || !newTask.description}
              >
                {translations.form.create}
              </Button>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Eliminação</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text fontSize="lg" fontWeight="medium">
                Tem a certeza que pretende eliminar esta tarefa?
              </Text>
              {taskToDelete && (
                <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md" w="full">
                  <Text fontWeight="semibold" mb={2}>
                    {taskToDelete.title}
                  </Text>
                  <Text fontSize="sm" color={textColorSecondary}>
                    {taskToDelete.description}
                  </Text>
                </Box>
              )}
              <Text fontSize="sm" color={textColorMuted}>
                Esta ação não pode ser desfeita.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button 
              colorScheme="red" 
              onClick={confirmDelete}
              isLoading={deletingTaskId === taskToDelete?.id}
              isDisabled={deletingTaskId === taskToDelete?.id}
            >
              Eliminar Tarefa
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Kanban; 