import {
  companyRepository,
  userRepository,
} from '@/repositories/index.ts'

export const peopleApi = {
  listUsers: () => userRepository.getAll(),
  listCompanies: () => companyRepository.getAll(),
  listAll: () => [...userRepository.getAll(), ...companyRepository.getAll()],
  get: (id: string) =>
    userRepository.getById(id) ?? companyRepository.getById(id),
}
