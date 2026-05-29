import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  useToast,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Text,
  useColorModeValue,
  HStack,
  Box,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CONFIG } from '../config'
import type { AuthUser } from '../types'
import { FaUser, FaBuilding } from 'react-icons/fa'

// Zod requires a mutable, non-empty array for enums.
const fractions: [string, ...string[]] = ['A', 'B', 'C', 'D', 'E', 'F'];

const setupSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  fraction: z.enum(fractions, {
    errorMap: () => ({ message: 'Por favor, selecione uma fração válida.' }),
  }),
})

type SetupFormData = z.infer<typeof setupSchema>

interface SetupModalProps {
  user: AuthUser
  onSubmit: (data: SetupFormData) => Promise<{ error: any }>
  onClose: () => void
}

export default function SetupModal({ user, onSubmit, onClose }: SetupModalProps) {
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: user.name || '',
      fraction: user.fraction && fractions.includes(user.fraction) ? user.fraction : undefined,
    },
  })

  const handleFormSubmit = async (data: SetupFormData) => {
    const { error } = await onSubmit(data)
    if (error) {
      toast({
        title: 'Erro ao atualizar o perfil',
        description: 'Não foi possível guardar as suas informações. Tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'Bem-vind@!',
        description: 'O seu perfil foi configurado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onClose()
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      isCentered
      closeOnOverlayClick={false}
      closeOnEsc={false}
    >
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent as="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <ModalHeader borderBottomWidth="1px">
          <HStack>
            <FaUser /> <Text>Configuração Inicial</Text>
          </HStack>
          <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1}>
            Precisamos de mais alguns detalhes para completar o seu perfil.
          </Text>
        </ModalHeader>
        <ModalBody>
          <VStack spacing={4} py={4}>
            <FormControl isInvalid={!!errors.name}>
              <FormLabel htmlFor="name">
                <HStack>
                  <FaUser /> <Text>O seu nome completo</Text>
                </HStack>
              </FormLabel>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: João Silva"
              />
              {errors.name && (
                <Text color="red.500" fontSize="sm">
                  {errors.name.message}
                </Text>
              )}
            </FormControl>
            <FormControl isInvalid={!!errors.fraction}>
              <FormLabel htmlFor="fraction">
                <HStack>
                  <FaBuilding /> <Text>A sua fração</Text>
                </HStack>
              </FormLabel>
              <Select
                id="fraction"
                {...register('fraction')}
                placeholder="Selecione a sua fração"
              >
                {fractions.map(f => (
                  <option key={f} value={f}>
                    Fração {f}
                  </option>
                ))}
              </Select>
              {errors.fraction && (
                <Text color="red.500" fontSize="sm">
                  {errors.fraction.message}
                </Text>
              )}
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter borderTopWidth="1px">
          <Button
            colorScheme="blue"
            type="submit"
            isLoading={isSubmitting}
            w="full"
          >
            Guardar e Continuar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
} 