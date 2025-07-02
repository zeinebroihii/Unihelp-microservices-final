  echo "Monitoring EKS pod resources at $(date)" > resource_usage.txt
  kubectl get pods --all-namespaces -o jsonpath="{range .items[*]}{.metadata.name}{' '}{.status.containerStatuses[0].usage.cpu}{' '}{.status.containerStatuses[0].usage.memory}{'\n'}" >> resource_usage.txt
  echo "Resource usage for user and course services logged to resource_usage.txt"
