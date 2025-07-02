package unihelp.example.offres;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;


@SpringBootApplication
@EnableFeignClients
public class OffresApplication {

	public static void main(String[] args) {
		SpringApplication.run(OffresApplication.class, args);
	}
	public void generateQRCodeOnStartup() {

	}
}
